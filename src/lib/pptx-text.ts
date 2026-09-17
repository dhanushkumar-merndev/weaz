import { inflateRawSync } from "node:zlib";
import type { CourseSlide } from "@/lib/course-types";

// Dependency-free reader for the text of a .pptx file, which is a ZIP archive
// of XML parts. It extracts, per slide in presentation order:
//   title placeholder -> title, other text boxes and table rows -> points,
//   speaker notes -> description.

const MAX_PART_BYTES = 20 * 1024 * 1024;

export class PptxFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PptxFormatError";
  }
}

function readZipEntries(buffer: Buffer) {
  const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 22 - 0xffff); i--) {
    if (buffer.readUInt32LE(i) === END_OF_CENTRAL_DIRECTORY) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new PptxFormatError("Not a ZIP archive");

  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  const entries = new Map<string, () => Buffer>();

  for (let n = 0; n < count; n++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new PptxFormatError("Corrupt ZIP central directory");
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    offset += 46 + nameLength + extraLength + commentLength;

    entries.set(name, () => {
      if (size > MAX_PART_BYTES) throw new PptxFormatError(`${name} is too large`);
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
        throw new PptxFormatError("Corrupt ZIP local header");
      }
      const start =
        localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
      const data = buffer.subarray(start, start + compressedSize);
      if (method === 0) return data;
      if (method === 8) return inflateRawSync(data, { maxOutputLength: MAX_PART_BYTES });
      throw new PptxFormatError(`Unsupported ZIP compression method ${method}`);
    });
  }

  return entries;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeXml(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity: string) =>
    entity[0] === "#"
      ? String.fromCodePoint(
          entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
        )
      : ENTITIES[entity.toLowerCase()]
  );
}

/** Non-empty paragraphs; soft line breaks (<a:br/>) stay within a paragraph. */
function paragraphs(xml: string) {
  const result: string[] = [];
  for (const [, body] of xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)) {
    const text = [...body.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>|<a:br\b[^>]*\/>/g)]
      .map((match) => (match[1] === undefined ? " " : decodeXml(match[1])))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (text) result.push(text);
  }
  return result;
}

/** A shape's placeholder type; untyped placeholders are body placeholders. */
function placeholderType(shapeXml: string) {
  const placeholder = shapeXml.match(/<p:ph\b([^>]*)>/);
  if (!placeholder) return null;
  return placeholder[1].match(/\btype="([^"]+)"/)?.[1] ?? "body";
}

function relationships(xml: string | undefined) {
  const map = new Map<string, { target: string; type: string }>();
  for (const [, attributes] of (xml ?? "").matchAll(/<Relationship\b([^>]*)>/g)) {
    const attribute = (name: string) => attributes.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
    const id = attribute("Id");
    const target = attribute("Target");
    if (id && target) map.set(id, { target, type: attribute("Type") ?? "" });
  }
  return map;
}

function resolvePart(baseDir: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const segments = baseDir.split("/");
  for (const segment of target.split("/")) {
    if (segment === "..") segments.pop();
    else if (segment !== ".") segments.push(segment);
  }
  return segments.join("/");
}

const TITLE_TYPES = new Set(["title", "ctrTitle"]);
// Page furniture, not slide content.
const IGNORED_TYPES = new Set(["sldNum", "ftr", "hdr", "dt", "sldImg"]);

export interface PptxDeck {
  title: string;
  slides: CourseSlide[];
}

export function readPptxText(buffer: Buffer, maxSlides: number): PptxDeck {
  const entries = readZipEntries(buffer);
  const part = (name: string) => entries.get(name)?.().toString("utf8");

  const presentation = part("ppt/presentation.xml");
  if (!presentation) throw new PptxFormatError("Not a PowerPoint file");

  const presentationRels = relationships(part("ppt/_rels/presentation.xml.rels"));
  const slideParts = [...presentation.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)]
    .map(([, relId]) => presentationRels.get(relId))
    .filter((rel) => rel !== undefined)
    .map((rel) => resolvePart("ppt", rel.target))
    .slice(0, maxSlides);

  const slides = slideParts.map((slidePart): CourseSlide => {
    const xml = part(slidePart) ?? "";
    let title = "";
    const points: string[] = [];

    for (const [shape, tag] of xml.matchAll(/<p:(sp|graphicFrame)\b[\s\S]*?<\/p:\1>/g)) {
      if (tag === "graphicFrame") {
        for (const [row] of shape.matchAll(/<a:tr\b[\s\S]*?<\/a:tr>/g)) {
          const cells = [...row.matchAll(/<a:tc\b[\s\S]*?<\/a:tc>/g)]
            .map(([cell]) => paragraphs(cell).join(" "))
            .filter(Boolean);
          if (cells.length) points.push(cells.join(" · "));
        }
        continue;
      }

      const type = placeholderType(shape);
      if (type && IGNORED_TYPES.has(type)) continue;
      const lines = paragraphs(shape);
      if (!lines.length) continue;

      if (!title && type && TITLE_TYPES.has(type)) {
        title = lines.join(" ");
      } else {
        points.push(...lines);
      }
    }

    if (!title && points.length) title = points.shift()!;

    let description = "";
    const slideDir = slidePart.slice(0, slidePart.lastIndexOf("/"));
    const slideRels = relationships(part(slidePart.replace(/([^/]+)$/, "_rels/$1.rels")));
    const notesRel = [...slideRels.values()].find((rel) => rel.type.endsWith("/notesSlide"));
    if (notesRel) {
      const notesXml = part(resolvePart(slideDir, notesRel.target)) ?? "";
      for (const [shape] of notesXml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)) {
        if (placeholderType(shape) === "body") {
          description = paragraphs(shape).join("\n");
          break;
        }
      }
    }

    return { title, description, points };
  });

  const title = part("docProps/core.xml")?.match(/<dc:title>([\s\S]*?)<\/dc:title>/)?.[1];
  return { title: title ? decodeXml(title).trim() : "", slides };
}
