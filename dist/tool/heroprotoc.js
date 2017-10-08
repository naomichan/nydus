"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Overmind {
}
exports.Overmind = Overmind;
function TPL(strings, ...keys) {
    let str = "";
    strings.forEach((element) => {
        str += element;
        if (keys.length > 0) {
            str += JSON.stringify(keys.shift());
        }
    });
    return str;
}
function Parse(value) {
    return Function(`return (${value})`)();
}
function Create(version, typeInfos, gameEventTypes, gameEventTypeId, messageEventTypes, messageEventTypeId, trackerEventTypes, trackerEventTypeId, sVarUint32TypeId, userTypeId, headerTypeId, gameDetailsTypeId, initDataTypeId) {
    return TPL `// Generated from protocol${version}.py
export var VERSION = ${version};

export var TYPE_INFO = ${typeInfos};

export var GAME_EVENT = [${gameEventTypeId}, ${gameEventTypes}];
export var MESSAGE_EVENT = [${messageEventTypeId}, ${messageEventTypes}];
export var TRACKER_EVENT = [${trackerEventTypeId}, ${trackerEventTypes}];

export var REPLAY = [${sVarUint32TypeId}, ${userTypeId}, ${headerTypeId}, ${gameDetailsTypeId}, ${initDataTypeId}];

export default { VERSION, TYPE_INFO, GAME_EVENT, MESSAGE_EVENT, TRACKER_EVENT, REPLAY };
`;
}
function FixL(line) {
    return line.replace(/\(/gm, "[").replace(/\)/gm, "]").replace(/,$/, "").replace(/'/gm, "\"");
}
function Generate(contents, version) {
    const lines = contents.split("\n");
    const typeInfos = [];
    const gameEventTypes = {};
    const messageEventTypes = {};
    const trackerEventTypes = {};
    let messageEventTypeId = 0;
    let gameEventTypeId = 0;
    let trackerEventTypeId = 0;
    let sVarUint32TypeId = 0;
    let userTypeId = 0;
    let headerTypeId = 0;
    let gameDetailsTypeId = 0;
    let initDataTypeId = 0;
    let state = 0;
    lines.forEach((element) => {
        const line = element.split("#")[0].trim();
        if (state === 0) {
            switch (line.split("=")[0].trim()) {
                case "typeinfos":
                    state = 1;
                    break;
                case "game_event_types":
                    state = 1001;
                    break;
                case "message_event_types":
                    state = 1002;
                    break;
                case "tracker_event_types":
                    state = 1003;
                    break;
                case "game_eventid_typeid":
                    gameEventTypeId = parseInt(line.split("=")[1].trim(), 10);
                    break;
                case "message_eventid_typeid":
                    messageEventTypeId = parseInt(line.split("=")[1].trim(), 10);
                    break;
                case "tracker_eventid_typeid":
                    trackerEventTypeId = parseInt(line.split("=")[1].trim(), 10);
                    break;
                case "svaruint32_typeid":
                    sVarUint32TypeId = parseInt(line.split("=")[1].trim(), 10);
                    break;
                case "replay_userid_typeid":
                    userTypeId = parseInt(line.split("=")[1].trim(), 10);
                    break;
                case "replay_header_typeid":
                    headerTypeId = parseInt(line.split("=")[1].trim(), 10);
                    break;
                case "game_details_typeid":
                    gameDetailsTypeId = parseInt(line.split("=")[1].trim(), 10);
                    break;
                case "replay_initdata_typeid":
                    initDataTypeId = parseInt(line.split("=")[1].trim(), 10);
                    break;
                default: break;
            }
        }
        else if (state < 1000) {
            if (line[0] === "]") {
                state = 0;
                return;
            }
            const av = Parse(FixL(line));
            if (state === 1) {
                typeInfos.push(av);
            }
        }
        else if (state > 1000) {
            if (line[0] === "}") {
                state = 0;
                return;
            }
            const d = line.split(":", 2).map((x) => x.trim());
            const dk = d[0];
            const dv = d[1];
            if (state === 1001) {
                gameEventTypes[parseInt(dk, 10)] = Parse(FixL(dv));
            }
            else if (state === 1002) {
                messageEventTypes[parseInt(dk, 10)] = Parse(FixL(dv));
            }
            else if (state === 1003) {
                trackerEventTypes[parseInt(dk, 10)] = Parse(FixL(dv));
            }
        }
    });
    return Create(version, typeInfos, gameEventTypes, gameEventTypeId, messageEventTypes, messageEventTypeId, trackerEventTypes, trackerEventTypeId, sVarUint32TypeId, userTypeId, headerTypeId, gameDetailsTypeId, initDataTypeId);
}
exports.Generate = Generate;
exports.default = { Generate, Overmind };
//# sourceMappingURL=heroprotoc.js.map