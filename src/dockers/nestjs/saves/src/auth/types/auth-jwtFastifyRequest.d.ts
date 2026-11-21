import { FastifyRequest } from "fastify";
import { Multipart, FastifyMultipartBaseOptions,
	MultipartFile, SavedMultipartFilesResult,
	SavedMultipartFile
 } from "@fastify/multipart";
import { CurrentUser } from "./current-user.js";
import { BusboyConfig, BusboyFileStream } from '@fastify/busboy'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Readable } from 'node:stream'
import { FastifyErrorConstructor } from '@fastify/error'

export interface AuthJwtFastifyRequest extends FastifyRequest {
	user: CurrentUser;

	isMultipart: () => boolean;

    formData: () => Promise<FormData>;

    // promise api
    parts: (
      options?: Omit<BusboyConfig, 'headers'>
    ) => AsyncIterableIterator<Multipart>;

    // Stream mode
    file: (
      options?: Omit<BusboyConfig, 'headers'> | FastifyMultipartBaseOptions
    ) => Promise<MultipartFile | undefined>;
    files: (
      options?: Omit<BusboyConfig, 'headers'> | FastifyMultipartBaseOptions
    ) => AsyncIterableIterator<MultipartFile>;

    // Disk mode
    saveRequestFiles: (
      options?: Omit<BusboyConfig, 'headers'> & { tmpdir?: string }
    ) => Promise<SavedMultipartFilesResult>;
    cleanRequestFiles: () => Promise<void>;
    tmpUploads: Array<string> | null;
    /** This will get populated as soon as a call to `saveRequestFiles` gets resolved. Avoiding any future duplicate work */
    savedRequestFiles: Array<SavedMultipartFile> | null;
}