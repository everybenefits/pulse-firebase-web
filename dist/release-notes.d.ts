import { type Functions } from "firebase/functions";
import { type ReleaseNoteEntry, type ReleaseNoteUpsertInput } from "@everybenefits/shared";
export type ReleaseNoteAdminRow = ReleaseNoteEntry & {
    published: boolean;
};
export type ReleaseNotesRepository = {
    listPublishedReleaseNotes: () => Promise<ReleaseNoteEntry[]>;
    listReleaseNotesAdmin: () => Promise<ReleaseNoteAdminRow[]>;
    upsertReleaseNote: (input: ReleaseNoteUpsertInput) => Promise<ReleaseNoteAdminRow>;
    deleteReleaseNote: (id: string) => Promise<void>;
};
export declare function createReleaseNotesRepository(functions: Functions): ReleaseNotesRepository;
//# sourceMappingURL=release-notes.d.ts.map