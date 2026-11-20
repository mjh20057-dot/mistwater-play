// Placement is in the background's 1672 × 941 coordinates. Feet locate the
// floor contact; height is the sprite frame, never a CSS scale around its centre.
// These are staged against doors, counters and seats at the same floor depth.
export const SCENE_BLOCKING={
 guestHall:{
  otter:{feet:[930,875],height:650},
  deer:{feet:[1300,855],height:680}
 },
 lobby:{
  badger:{feet:[1360,850],height:570},
  otter:{feet:[1115,820],height:550},
  hedgehog:{feet:[850,890],height:530},
  rabbit:{feet:[655,755],height:440},
  cat:{feet:[410,820],height:480}
 },
 gallery:{hedgehog:{feet:[1050,860],height:540}},
 dining:{
  badger:{feet:[1030,750],height:510},
  hedgehog:{feet:[1480,900],height:590},
  otter:{feet:[1100,890],height:550},
  cat:{feet:[740,840],height:460},
  deer:{feet:[435,875],height:500},
  rabbit:{feet:[930,740],height:440}
 },
 corridor:{
  deer:{feet:[820,860],height:620},
  rabbit:{feet:[1160,875],height:530},
  otter:{feet:[1130,870],height:540}
 },
 room18:{hedgehog:{feet:[1370,865],height:580}}
};

export function scenePlacement(person,state={}){
 const place=state.active?.id==='roomMeeting'?'guestHall':state.location;
 return SCENE_BLOCKING[place]?.[person]||null;
}
