"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LiveChat_instances, _LiveChat_observer, _LiveChat_options, _LiveChat_interval, _LiveChat_id, _LiveChat_execute;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveChat = void 0;
const events_1 = require("events");
const requests_1 = require("./requests");
/**
 * YouTubeライブチャット取得イベント
 */
class LiveChat extends events_1.EventEmitter {
    constructor(id, interval = 1000) {
        super();
        _LiveChat_instances.add(this);
        _LiveChat_observer.set(this, void 0);
        _LiveChat_options.set(this, void 0);
        _LiveChat_interval.set(this, 1000);
        _LiveChat_id.set(this, void 0);
        if (!id || (!("channelId" in id) && !("liveId" in id) && !("handle" in id))) {
            throw TypeError("Required channelId or liveId or handle.");
        }
        else if ("liveId" in id) {
            this.liveId = id.liveId;
        }
        __classPrivateFieldSet(this, _LiveChat_id, id, "f");
        __classPrivateFieldSet(this, _LiveChat_interval, interval, "f");
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _LiveChat_observer, "f")) {
                return false;
            }
            try {
                const options = yield (0, requests_1.fetchLivePage)(__classPrivateFieldGet(this, _LiveChat_id, "f"));
                this.liveId = options.liveId;
                __classPrivateFieldSet(this, _LiveChat_options, options, "f");
                __classPrivateFieldSet(this, _LiveChat_observer, setInterval(() => __classPrivateFieldGet(this, _LiveChat_instances, "m", _LiveChat_execute).call(this), __classPrivateFieldGet(this, _LiveChat_interval, "f")), "f");
                this.emit("start", this.liveId);
                return true;
            }
            catch (err) {
                this.emit("error", err);
                return false;
            }
        });
    }
    stop(reason) {
        if (__classPrivateFieldGet(this, _LiveChat_observer, "f")) {
            clearInterval(__classPrivateFieldGet(this, _LiveChat_observer, "f"));
            __classPrivateFieldSet(this, _LiveChat_observer, undefined, "f");
            this.emit("end", reason);
        }
    }
}
exports.LiveChat = LiveChat;
_LiveChat_observer = new WeakMap(), _LiveChat_options = new WeakMap(), _LiveChat_interval = new WeakMap(), _LiveChat_id = new WeakMap(), _LiveChat_instances = new WeakSet(), _LiveChat_execute = function _LiveChat_execute() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!__classPrivateFieldGet(this, _LiveChat_options, "f")) {
            const message = "Not found options";
            this.emit("error", new Error(message));
            this.stop(message);
            return;
        }
        try {
            const [chatItems, continuation] = yield (0, requests_1.fetchChat)(__classPrivateFieldGet(this, _LiveChat_options, "f"));
            chatItems.forEach((chatItem) => this.emit("chat", chatItem));
            __classPrivateFieldGet(this, _LiveChat_options, "f").continuation = continuation;
        }
        catch (err) {
            this.emit("error", err);
        }
    });
};
//# sourceMappingURL=live-chat.js.map