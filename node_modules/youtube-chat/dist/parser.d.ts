import { FetchOptions, GetLiveChatResponse } from "./types/yt-response";
import { ChatItem } from "./types/data";
export declare function getOptionsFromLivePage(data: string): FetchOptions & {
    liveId: string;
};
/** get_live_chat レスポンスを変換 */
export declare function parseChatData(data: GetLiveChatResponse): [ChatItem[], string];
