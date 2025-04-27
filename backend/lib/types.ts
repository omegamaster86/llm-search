import type { Document } from "@langchain/core/documents";

export interface NotionPage {
	id: string;
	url: string;
	properties: {
		title?: {
			title: Array<{
				plain_text: string;
			}>;
		};
	};
}

export interface NotionBlock {
	type: string;
	paragraph?: {
		rich_text: Array<{
			plain_text: string;
		}>;
	};
}

export interface DriveFile {
	id: string;
	name: string;
	webViewLink: string;
	mimeType: string;
}

export interface DriveResponse {
	data: {
		files: DriveFile[];
	};
}

export interface SearchDocument extends Document {
	metadata: {
		source: "notion" | "google-drive";
		title: string;
		url: string;
	};
}
