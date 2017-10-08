// Goal: Write a tool utility file that is capable of converting Blizzard/heroprotocol.ts files without issue.
// Secondary goal: a library that can download .py files for unrecognized replay versions
//
// Since the "protocol" python files only have different metadata (the methods never change)
// we only need to store those, thus it's easy to automate.
//

export class Overmind {

}

function TPL(strings: TemplateStringsArray, ...keys: any[]): string {
  let str: string = "";
  strings.forEach((element) => {
    str += element;
    if(keys.length > 0) {
      str += JSON.stringify(keys.shift());
    }
  });
  return str;
}

function Parse(value: string): any {
  return Function(`return (${value})`)();
}

function Create(version: number, typeInfos: string[],
                gameEventTypes: {[key: number]: any}, gameEventTypeId: number,
                messageEventTypes: {[key: number]: any}, messageEventTypeId: number,
                trackerEventTypes: {[key: number]: any}, trackerEventTypeId: number,
                sVarUint32TypeId: number, userTypeId: number, headerTypeId: number,
                gameDetailsTypeId: number, initDataTypeId: number): string {
  return TPL`// Generated from protocol${version}.py
exports.VERSION = ${version};

exports.TYPE_INFO = ${typeInfos};

exports.GAME_EVENT = [${gameEventTypeId}, ${gameEventTypes}];
exports.MESSAGE_EVENT = [${messageEventTypeId}, ${messageEventTypes}];
exports.TRACKER_EVENT = [${trackerEventTypeId}, ${trackerEventTypes}];

exports.REPLAY = [${sVarUint32TypeId}, ${userTypeId}, ${headerTypeId}, ${gameDetailsTypeId}, ${initDataTypeId}];
`;
}

function FixL(line: string): string {
  return line.replace(/\(/gm, "[").replace(/\)/gm, "]").replace(/,$/, "").replace(/'/gm, "\"");
}

export function Generate(contents: string, version: number): string {
  const lines: string[] = contents.split("\n");

  const typeInfos: string[] = [];
  const gameEventTypes: {[key: number]: any} = {};
  const messageEventTypes: {[key: number]: any} = {};
  const trackerEventTypes: {[key: number]: any} = {};
  let messageEventTypeId: number = 0;
  let gameEventTypeId: number = 0;
  let trackerEventTypeId: number = 0;
  let sVarUint32TypeId: number = 0;
  let userTypeId: number = 0;
  let headerTypeId: number = 0;
  let gameDetailsTypeId: number = 0;
  let initDataTypeId: number = 0;

  let state: number = 0;

  lines.forEach((element) => {
    const line: string = element.split("#")[0].trim();
    if(state === 0) {
      switch(line.split("=")[0].trim()) {
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
    } else if(state < 1000) {
      if(line[0] === "]") {
        state = 0;
        return;
      }
      const av = Parse(FixL(line));
      if(state === 1) {
        typeInfos.push(av);
      }
    } else if(state > 1000) {
      if(line[0] === "}") {
        state = 0;
        return;
      }
      const d: string[] = line.split(":", 2).map((x) => x.trim());
      const dk: string = d[0];
      const dv: string = d[1];
      if(state === 1001) {
        gameEventTypes[parseInt(dk, 10)] = Parse(FixL(dv));
      } else if(state === 1002) {
        messageEventTypes[parseInt(dk, 10)] = Parse(FixL(dv));
      } else if(state === 1003) {
        trackerEventTypes[parseInt(dk, 10)] = Parse(FixL(dv));
      }
    }
  });

  return Create(version, typeInfos, gameEventTypes, gameEventTypeId,
                messageEventTypes, messageEventTypeId, trackerEventTypes, trackerEventTypeId,
                sVarUint32TypeId, userTypeId, headerTypeId, gameDetailsTypeId,
                initDataTypeId);
}

export default { Generate, Overmind };
