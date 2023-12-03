import { FetchOptions } from "./types/yt-response";
import { ChatItem } from "./types/data";
export declare function fetchChat(options: FetchOptions): Promise<[ChatItem[], string]>;
export declare function fetchLivePage(id: {
    channelId: string;
} | {
    liveId: string;
} | {
    handle: string;
}): Promise<FetchOptions & {
    liveId: string;
}>;
