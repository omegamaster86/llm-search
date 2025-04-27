import { MemoryVectorStore } from "@langchain/community/vectorstores";
import type { Document } from "@langchain/core/documents";
import type {
	DriveFile,
	DriveResponse,
	NotionBlock,
	NotionPage,
	SearchDocument,
} from "./types";

interface SearchResult {
	source: "notion" | "google-drive";
	title: string;
	content: string;
	url: string;
}

// Notionからの検索
async function searchNotion(query: string): Promise<SearchResult[]> {
	const response = await notion.search({
		query,
		filter: {
			property: "object",
			value: "page",
		},
	});

	return await Promise.all(
		response.results.map(async (page: NotionPage) => {
			const blocks = await notion.blocks.children.list({
				block_id: page.id,
			});

			const content = blocks.results
				.map((block: NotionBlock) => {
					if (block.type === "paragraph") {
						return block.paragraph.rich_text
							.map((text: any) => text.plain_text)
							.join("");
					}
					return "";
				})
				.join("\n");

			return {
				source: "notion" as const,
				title: page.properties.title?.title[0]?.plain_text || "Untitled",
				content,
				url: page.url,
			};
		}),
	);
}

// Google Driveからの検索
async function searchGoogleDrive(query: string): Promise<SearchResult[]> {
	const response = (await drive.files.list({
		q: `fullText contains '${query}'`,
		fields: "files(id, name, webViewLink, mimeType)",
	})) as DriveResponse;

	return await Promise.all(
		(response.data.files || []).map(async (file: DriveFile) => {
			let content = "";

			if (file.mimeType === "application/pdf") {
				// PDFの内容を取得（実装は省略）
			} else if (file.mimeType === "text/plain") {
				const fileContent = await drive.files.get({
					fileId: file.id!,
					alt: "media",
				});
				content = fileContent.data as string;
			}

			return {
				source: "google-drive" as const,
				title: file.name || "Untitled",
				content,
				url: file.webViewLink || "",
			};
		}),
	);
}

// LLMを使用した検索結果の処理
async function processWithLLM(
	results: SearchResult[],
	query: string,
): Promise<string> {
	// 検索結果をテキストチャンクに分割
	const docs = await Promise.all(
		results.map(async (result) => {
			const chunks = await textSplitter.createDocuments([result.content]);
			return chunks.map((chunk: Document) => ({
				...chunk,
				metadata: {
					source: result.source,
					title: result.title,
					url: result.url,
				},
			}));
		}),
	);

	// ベクトルストアの作成
	const flatDocs = docs.flat() as SearchDocument[];
	const vectorStore = await MemoryVectorStore.fromDocuments(
		flatDocs,
		embeddings,
	);

	// 関連する文書の検索
	const relevantDocs = await vectorStore.similaritySearch(query, 5);

	// LLMによる回答生成
	const response = await model.invoke([
		{
			type: "system",
			content:
				"与えられた情報源に基づいて、質問に対して簡潔に答えてください。回答には関連する情報源のURLを含めてください。",
		},
		{
			type: "user",
			content: `質問: ${query}

関連情報:
${relevantDocs
	.map(
		(doc: SearchDocument) =>
			`[${doc.metadata.title}](${doc.metadata.url})
${doc.pageContent}
`,
	)
	.join("\n\n")}`,
		},
	]);

	return response.content;
}

// メイン検索関数
export async function search(query: string): Promise<string> {
	try {
		// 並行して各サービスから検索
		const [notionResults, driveResults] = await Promise.all([
			searchNotion(query),
			searchGoogleDrive(query),
		]);

		// 結果を統合
		const allResults = [...notionResults, ...driveResults];

		// LLMで処理
		const answer = await processWithLLM(allResults, query);

		return answer;
	} catch (error) {
		console.error("Search error:", error);
		throw error;
	}
}
