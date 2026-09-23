import { type Functions } from "firebase/functions";
import {
  releaseNoteEntrySchema,
  type ReleaseNoteEntry,
  type ReleaseNoteUpsertInput,
} from "@everybenefits/shared";
import { callCloudFunction } from "./callables";

export type ReleaseNoteAdminRow = ReleaseNoteEntry & {
  published: boolean;
};

function mapReleaseNote(entry: Record<string, unknown>): ReleaseNoteEntry {
  return releaseNoteEntrySchema.parse(entry);
}

export type ReleaseNotesRepository = {
  listPublishedReleaseNotes: () => Promise<ReleaseNoteEntry[]>;
  listReleaseNotesAdmin: () => Promise<ReleaseNoteAdminRow[]>;
  upsertReleaseNote: (
    input: ReleaseNoteUpsertInput,
  ) => Promise<ReleaseNoteAdminRow>;
  deleteReleaseNote: (id: string) => Promise<void>;
};

export function createReleaseNotesRepository(
  functions: Functions,
): ReleaseNotesRepository {
  return {
    async listPublishedReleaseNotes() {
      const data = await callCloudFunction<{
        notes?: Array<Record<string, unknown>>;
      }>(functions, "listPublishedReleaseNotes", {});
      return (data?.notes ?? [])
        .map(mapReleaseNote)
        .filter((note) => note.slug);
    },
    async listReleaseNotesAdmin() {
      const data = await callCloudFunction<{
        notes?: Array<Record<string, unknown> & { published?: boolean }>;
      }>(functions, "listReleaseNotesAdmin", {});
      return (data?.notes ?? []).map((entry) => ({
        ...mapReleaseNote(entry),
        published: entry.published === true,
      }));
    },
    async upsertReleaseNote(input) {
      const data = await callCloudFunction<{
        note?: Record<string, unknown> & { published?: boolean };
      }>(functions, "upsertReleaseNote", input);
      if (!data?.note) {
        throw new Error("Release note save failed.");
      }
      return {
        ...mapReleaseNote(data.note),
        published: data.note.published === true,
      };
    },
    async deleteReleaseNote(id) {
      await callCloudFunction(functions, "deleteReleaseNote", { id });
    },
  };
}
