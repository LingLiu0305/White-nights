import {storyText} from './story-text.js';
export const locations=[
  {
    "id": "home",
    "en": "THE LITTLE ROOM",
    "position": [
      -7,
      0,
      4
    ],
    "number": "01",
    "descriptionEn": "A little room so familiar that time seems to stand still. Each walk begins here, and so does each dream.",
    "noteEn": "The dreamer’s home · Schematic location"
  },
  {
    "id": "canal",
    "en": "THE EMBANKMENT",
    "position": [
      2.5,
      0,
      1.3
    ],
    "number": "02",
    "descriptionEn": "Water passes beneath the railing. Meeting, listening and waiting turn an ordinary stretch of riverbank into a place of promise.",
    "noteEn": "The principal meeting place across the four nights"
  },
  {
    "id": "house",
    "en": "HER NEIGHBOURHOOD",
    "position": [
      7,
      0,
      -4
    ],
    "number": "03",
    "descriptionEn": "A small house stands deep in the neighbourhood. She lives here with her grandmother; it is also where her story of waiting begins.",
    "noteEn": "Background to her story · Exploring does not advance the chapter"
  },
  {
    "id": "bridge",
    "en": "THE NIGHT WALK",
    "position": [
      0,
      0,
      -5.5
    ],
    "number": "04",
    "descriptionEn": "The bridge joins the two banks, just as a walk joins fragments of conversation. These paths suggest the story’s spaces rather than trace a historical route.",
    "noteEn": "A literary walking route · Not a historical reconstruction"
  }
];
export const chapters=[
  {
    "id": "night-1",
    "roman": "I",
    "en": "BEFORE WE MET",
    "place": "canal",
    "image": "canal-night.png",
    "tint": "first",
    "route": [
      [
        -7,
        4
      ],
      [
        -3,
        4
      ],
      [
        -3,
        1.3
      ],
      [
        2.5,
        1.3
      ]
    ],
    "labelEn": "First Night",
    "endingEn": "Tomorrow. The same place."
  },
  {
    "id": "night-2",
    "roman": "II",
    "en": "A LIFE SHARED IN WORDS",
    "place": "canal",
    "image": "canal-night.png",
    "tint": "second",
    "route": [
      [
        -7,
        4
      ],
      [
        -3,
        4
      ],
      [
        -3,
        -5.5
      ],
      [
        3,
        -5.5
      ],
      [
        3,
        1.3
      ]
    ],
    "labelEn": "Second Night",
    "endingEn": "One letter. Two different kinds of waiting."
  },
  {
    "id": "night-3",
    "roman": "III",
    "en": "WAITING FOR DIFFERENT FUTURES",
    "place": "canal",
    "image": "canal-night.png",
    "tint": "third",
    "route": [
      [
        7,
        -4
      ],
      [
        4,
        -4
      ],
      [
        4,
        1.3
      ],
      [
        2.5,
        1.3
      ]
    ],
    "labelEn": "Third Night",
    "endingEn": "When the rain ends, we shall meet again."
  },
  {
    "id": "night-4",
    "roman": "IV",
    "en": "THE TOMORROW WE ALMOST HAD",
    "place": "canal",
    "image": "canal-night.png",
    "tint": "fourth",
    "route": [
      [
        -7,
        4
      ],
      [
        -3,
        4
      ],
      [
        -3,
        1.3
      ],
      [
        2.5,
        1.3
      ]
    ],
    "labelEn": "Fourth Night",
    "endingEn": "Still, the river flows on."
  },
  {
    "id": "morning",
    "roman": "V",
    "en": "A MOMENT THAT WAS REAL",
    "place": "home",
    "image": "morning-room.png",
    "tint": "morning",
    "route": [
      [
        2.5,
        1.3
      ],
      [
        -3,
        1.3
      ],
      [
        -3,
        4
      ],
      [
        -7,
        4
      ]
    ],
    "labelEn": "Morning",
    "endingEn": "White Nights · The End"
  }
];
for(const chapter of chapters)chapter.lines=storyText[chapter.id];
