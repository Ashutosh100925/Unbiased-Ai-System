const DEFAULT_GRID_SIZE = 5;

const COLOR_MAP = {
  C: "#35e5ff",
  P: "#ff5ddb",
  G: "#45f7a2",
  O: "#ff9f52",
  V: "#9a6cff",
  B: "#2d4dff",
  R: "#ff2b2b",
  Y: "#ffe600",
  M: "#a92f2f",
};

const LEVELS_5X5 = [
  {
    pairs: {
      B: [
        [0, 0],
        [4, 1],
      ],
      R: [
        [0, 3],
        [3, 1],
      ],
      Y: [
        [1, 3],
        [2, 2],
      ],
      O: [
        [0, 4],
        [3, 2],
      ],
      G: [
        [3, 4],
        [4, 2],
      ],
    },
    solution: {
      B: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [4, 1],
      ],
      R: [
        [0, 3],
        [0, 2],
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
      ],
      Y: [
        [1, 3],
        [1, 2],
        [2, 2],
      ],
      O: [
        [0, 4],
        [1, 4],
        [2, 4],
        [2, 3],
        [3, 3],
        [3, 2],
      ],
      G: [
        [3, 4],
        [4, 4],
        [4, 3],
        [4, 2],
      ],
    },
  },
  {
    pairs: {
      R: [
        [0, 0],
        [4, 1],
      ],
      G: [
        [0, 2],
        [3, 1],
      ],
      Y: [
        [0, 4],
        [3, 3],
      ],
      B: [
        [1, 2],
        [4, 2],
      ],
      O: [
        [1, 4],
        [4, 3],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      Y: [
        [0, 0],
        [3, 4],
      ],
      G: [
        [2, 2],
        [3, 1],
      ],
      B: [
        [3, 0],
        [4, 4],
      ],
      R: [
        [3, 2],
        [4, 0],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      Y: [
        [0, 1],
        [3, 0],
      ],
      B: [
        [0, 2],
        [4, 0],
      ],
      G: [
        [0, 3],
        [4, 3],
      ],
      R: [
        [1, 3],
        [2, 2],
      ],
      O: [
        [3, 3],
        [4, 2],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [0, 3],
        [1, 0],
      ],
      G: [
        [0, 4],
        [4, 0],
      ],
      Y: [
        [2, 2],
        [4, 2],
      ],
      B: [
        [3, 3],
        [4, 1],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [0, 3],
        [4, 2],
      ],
      G: [
        [0, 4],
        [1, 3],
      ],
      Y: [
        [1, 1],
        [4, 4],
      ],
      B: [
        [1, 2],
        [3, 4],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      Y: [
        [0, 0],
        [4, 4],
      ],
      B: [
        [0, 2],
        [3, 1],
      ],
      R: [
        [0, 3],
        [3, 4],
      ],
      G: [
        [0, 4],
        [2, 3],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      B: [
        [0, 0],
        [2, 3],
      ],
      Y: [
        [0, 3],
        [2, 0],
      ],
      G: [
        [1, 0],
        [2, 2],
      ],
      R: [
        [3, 1],
        [3, 3],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      B: [
        [0, 0],
        [2, 3],
      ],
      Y: [
        [0, 3],
        [2, 0],
      ],
      G: [
        [1, 0],
        [2, 2],
      ],
      R: [
        [3, 1],
        [3, 3],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [0, 3],
        [4, 2],
      ],
      Y: [
        [1, 1],
        [2, 2],
      ],
      B: [
        [1, 2],
        [4, 0],
      ],
      G: [
        [1, 3],
        [4, 1],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [0, 3],
        [4, 2],
      ],
      Y: [
        [1, 1],
        [2, 2],
      ],
      B: [
        [1, 2],
        [4, 0],
      ],
      G: [
        [1, 3],
        [4, 1],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      B: [
        [0, 0],
        [2, 1],
      ],
      Y: [
        [0, 1],
        [4, 1],
      ],
      R: [
        [0, 2],
        [4, 4],
      ],
      G: [
        [2, 2],
        [4, 0],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      B: [
        [0, 0],
        [2, 1],
      ],
      Y: [
        [0, 1],
        [4, 1],
      ],
      R: [
        [0, 2],
        [4, 4],
      ],
      G: [
        [2, 2],
        [4, 0],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      G: [
        [0, 0],
        [2, 4],
      ],
      R: [
        [0, 1],
        [0, 4],
      ],
      O: [
        [2, 3],
        [3, 0],
      ],
      B: [
        [3, 3],
        [4, 0],
      ],
      Y: [
        [3, 4],
        [4, 2],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [0, 0],
        [0, 4],
      ],
      B: [
        [2, 1],
        [4, 4],
      ],
      Y: [
        [2, 2],
        [3, 4],
      ],
      G: [
        [2, 4],
        [4, 1],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      B: [
        [1, 0],
        [3, 1],
      ],
      G: [
        [1, 1],
        [1, 3],
      ],
      R: [
        [2, 0],
        [3, 3],
      ],
      Y: [
        [3, 4],
        [4, 3],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [0, 1],
        [2, 0],
      ],
      O: [
        [1, 1],
        [3, 2],
      ],
      B: [
        [1, 3],
        [2, 2],
      ],
      Y: [
        [2, 1],
        [4, 0],
      ],
      G: [
        [4, 1],
        [4, 4],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      G: [
        [1, 1],
        [4, 2],
      ],
      R: [
        [1, 2],
        [3, 3],
      ],
      Y: [
        [1, 4],
        [3, 0],
      ],
      O: [
        [2, 4],
        [4, 3],
      ],
      B: [
        [3, 1],
        [4, 0],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [0, 0],
        [3, 2],
      ],
      G: [
        [0, 2],
        [2, 2],
      ],
      Y: [
        [0, 3],
        [3, 3],
      ],
      B: [
        [0, 4],
        [1, 0],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [1, 0],
        [4, 2],
      ],
      B: [
        [1, 1],
        [1, 3],
      ],
      G: [
        [2, 3],
        [3, 0],
      ],
      Y: [
        [3, 3],
        [4, 0],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      Y: [
        [1, 1],
        [4, 1],
      ],
      B: [
        [1, 3],
        [2, 2],
      ],
      R: [
        [3, 2],
        [4, 0],
      ],
      G: [
        [3, 4],
        [4, 2],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [0, 0],
        [0, 4],
      ],
      B: [
        [1, 1],
        [1, 3],
      ],
      G: [
        [1, 2],
        [3, 1],
      ],
      Y: [
        [1, 4],
        [4, 3],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      Y: [
        [1, 0],
        [3, 1],
      ],
      G: [
        [1, 1],
        [1, 3],
      ],
      B: [
        [2, 0],
        [4, 4],
      ],
      R: [
        [3, 2],
        [3, 4],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      B: [
        [0, 0],
        [2, 2],
      ],
      Y: [
        [0, 1],
        [4, 2],
      ],
      G: [
        [1, 2],
        [4, 1],
      ],
      R: [
        [2, 0],
        [4, 0],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      G: [
        [0, 2],
        [2, 0],
      ],
      Y: [
        [0, 3],
        [4, 0],
      ],
      B: [
        [0, 4],
        [3, 4],
      ],
      O: [
        [2, 3],
        [4, 1],
      ],
      R: [
        [3, 3],
        [4, 4],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      G: [
        [0, 0],
        [3, 3],
      ],
      Y: [
        [0, 1],
        [0, 3],
      ],
      O: [
        [0, 4],
        [2, 2],
      ],
      R: [
        [2, 0],
        [4, 3],
      ],
      B: [
        [2, 3],
        [4, 4],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      G: [
        [0, 0],
        [2, 4],
      ],
      O: [
        [1, 0],
        [2, 3],
      ],
      R: [
        [1, 1],
        [1, 3],
      ],
      B: [
        [3, 0],
        [3, 3],
      ],
      Y: [
        [3, 4],
        [4, 0],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      O: [
        [1, 0],
        [1, 4],
      ],
      R: [
        [1, 1],
        [1, 3],
      ],
      Y: [
        [2, 0],
        [4, 0],
      ],
      B: [
        [3, 1],
        [4, 3],
      ],
      G: [
        [3, 3],
        [4, 1],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      G: [
        [0, 2],
        [4, 4],
      ],
      R: [
        [0, 4],
        [1, 1],
      ],
      Y: [
        [1, 4],
        [3, 1],
      ],
      B: [
        [2, 1],
        [2, 3],
      ],
    },
    solution: null,
  },
  {
    pairs: {
      R: [
        [1, 1],
        [1, 3],
      ],
      B: [
        [2, 4],
        [3, 0],
      ],
      G: [
        [3, 2],
        [4, 4],
      ],
      Y: [
        [3, 4],
        [4, 0],
      ],
    },
    solution: null,
  },
];

function build6x6Levels() {
  const curatedFirst14 = [
    {
      pairs: {
        B: [[0, 0], [5, 3]],
        Y: [[2, 4], [3, 2]],
        G: [[3, 3], [4, 1]],
        R: [[3, 4], [4, 3]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[0, 0], [2, 4]],
        O: [[0, 1], [3, 4]],
        B: [[0, 5], [2, 2]],
        R: [[1, 5], [2, 3]],
        Y: [[4, 1], [4, 4]],
      },
      solution: null,
    },
    {
      pairs: {
        O: [[0, 5], [5, 0]],
        Y: [[1, 5], [5, 3]],
        G: [[1, 1], [5, 2]],
        R: [[2, 1], [2, 3]],
        B: [[4, 2], [4, 4]],
      },
      solution: null,
    },
    {
      pairs: {
        Y: [[0, 1], [4, 2]],
        R: [[0, 5], [1, 1]],
        B: [[1, 3], [5, 4]],
        C: [[2, 1], [3, 2]],
        G: [[2, 3], [4, 0]],
        O: [[2, 4], [4, 4]],
      },
      solution: null,
    },
    {
      pairs: {
        C: [[0, 2], [1, 0]],
        B: [[0, 3], [5, 0]],
        Y: [[1, 4], [4, 0]],
        G: [[2, 3], [3, 1]],
        O: [[2, 4], [4, 4]],
        R: [[3, 3], [4, 1]],
      },
      solution: null,
    },
    {
      pairs: {
        Y: [[0, 0], [5, 3]],
        B: [[1, 0], [2, 1]],
        R: [[2, 0], [5, 0]],
        G: [[2, 3], [4, 4]],
        C: [[2, 4], [5, 1]],
        O: [[4, 3], [5, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        O: [[0, 4], [4, 5]],
        G: [[1, 2], [5, 1]],
        B: [[1, 4], [5, 5]],
        R: [[3, 3], [5, 3]],
        Y: [[5, 0], [5, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[0, 2], [2, 0]],
        Y: [[0, 3], [1, 5]],
        O: [[1, 0], [4, 1]],
        G: [[1, 1], [4, 4]],
        R: [[1, 2], [2, 5]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[0, 1], [3, 3]],
        Y: [[0, 2], [5, 1]],
        B: [[1, 1], [2, 3]],
        R: [[1, 2], [5, 0]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[1, 1], [2, 5]],
        O: [[1, 2], [1, 4]],
        R: [[1, 5], [3, 4]],
        G: [[3, 5], [4, 0]],
        Y: [[4, 1], [4, 4]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[0, 0], [1, 5]],
        O: [[1, 3], [4, 2]],
        B: [[1, 4], [4, 4]],
        Y: [[2, 3], [4, 1]],
        G: [[2, 5], [3, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[0, 0], [2, 5]],
        G: [[0, 1], [0, 5]],
        C: [[1, 2], [4, 2]],
        O: [[2, 0], [5, 5]],
        Y: [[3, 1], [3, 5]],
        B: [[4, 1], [5, 0]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[0, 2], [2, 3]],
        Y: [[0, 3], [1, 5]],
        O: [[1, 1], [3, 2]],
        G: [[1, 2], [4, 4]],
        R: [[2, 5], [4, 0]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[0, 2], [2, 3]],
        Y: [[0, 3], [1, 5]],
        O: [[1, 1], [3, 2]],
        G: [[1, 2], [4, 4]],
        R: [[2, 5], [4, 0]],
      },
      solution: null,
    },
  ];

  const curated15to29 = [
    {
      pairs: {
        B: [[0, 0], [5, 3]],
        Y: [[2, 4], [3, 2]],
        G: [[3, 3], [4, 1]],
        R: [[3, 4], [4, 3]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[0, 0], [2, 4]],
        B: [[0, 5], [2, 2]],
        R: [[1, 5], [2, 3]],
        O: [[0, 1], [3, 4]],
        Y: [[4, 1], [4, 4]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[1, 1], [5, 5]],
        R: [[0, 5], [2, 1]],
        B: [[2, 1], [2, 3]],
        Y: [[1, 5], [3, 1]],
      },
      solution: null,
    },
    {
      pairs: {
        Y: [[1, 1], [4, 2]],
        G: [[1, 4], [4, 4]],
        R: [[2, 3], [5, 3]],
        B: [[4, 3], [5, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        O: [[0, 1], [4, 5]],
        G: [[0, 5], [2, 5]],
        Y: [[2, 2], [3, 3]],
        B: [[1, 3], [5, 4]],
        C: [[2, 1], [3, 2]],
        R: [[0, 5], [1, 1]],
      },
      solution: null,
    },
    {
      pairs: {
        C: [[0, 2], [1, 0]],
        B: [[0, 3], [5, 0]],
        Y: [[1, 4], [4, 0]],
        G: [[2, 3], [3, 1]],
        O: [[2, 4], [4, 4]],
        R: [[3, 3], [4, 1]],
      },
      solution: null,
    },
    {
      pairs: {
        Y: [[0, 0], [5, 3]],
        B: [[1, 0], [2, 1]],
        R: [[2, 0], [5, 0]],
        G: [[2, 3], [4, 4]],
        C: [[2, 4], [5, 1]],
        O: [[4, 3], [5, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[1, 1], [2, 5]],
        O: [[1, 2], [1, 4]],
        R: [[1, 5], [3, 4]],
        G: [[3, 5], [4, 0]],
        Y: [[4, 1], [4, 4]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[0, 0], [5, 3]],
        O: [[1, 3], [3, 0]],
        B: [[3, 3], [5, 0]],
        G: [[1, 0], [4, 3]],
        Y: [[4, 2], [5, 1]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[0, 1], [4, 4]],
        O: [[0, 2], [2, 3]],
        R: [[1, 5], [4, 0]],
        B: [[2, 3], [4, 5]],
        C: [[3, 2], [5, 4]],
        Y: [[3, 3], [5, 3]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[0, 0], [4, 0]],
        Y: [[0, 1], [3, 3]],
        C: [[0, 2], [5, 5]],
        R: [[0, 4], [2, 1]],
        B: [[0, 5], [3, 1]],
        O: [[1, 4], [4, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[1, 0], [3, 5]],
        B: [[1, 1], [3, 4]],
        G: [[1, 3], [4, 4]],
        O: [[2, 1], [5, 0]],
        Y: [[3, 1], [4, 1]],
      },
      solution: null,
    },
    {
      pairs: {
        Y: [[0, 0], [2, 3]],
        R: [[0, 1], [5, 1]],
        B: [[1, 1], [5, 0]],
        G: [[4, 1], [4, 4]],
      },
      solution: null,
    },
    {
      pairs: {
        O: [[0, 0], [4, 1]],
        Y: [[1, 0], [5, 2]],
        R: [[1, 4], [4, 4]],
        G: [[1, 5], [5, 3]],
        B: [[2, 4], [5, 4]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[0, 0], [5, 3]],
        G: [[1, 0], [4, 3]],
        O: [[2, 3], [3, 0]],
        B: [[3, 3], [5, 0]],
        Y: [[4, 2], [5, 1]],
      },
      solution: null,
    },
  ];

  const curatedLevel30 = {
    pairs: {
      O: [[0, 5], [4, 3]],
      Y: [[2, 1], [3, 5]],
      R: [[2, 2], [4, 4]],
      G: [[3, 3], [4, 1]],
      B: [[4, 5], [5, 3]],
    },
    solution: null,
  };

  const templates = [
    {
      pairs: {
        R: [[0, 1], [2, 4]],
        G: [[0, 5], [3, 2]],
        B: [[1, 3], [4, 0]],
        Y: [[2, 1], [5, 4]],
        O: [[1, 0], [4, 5]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[0, 0], [3, 3]],
        G: [[0, 4], [4, 1]],
        B: [[1, 2], [5, 5]],
        Y: [[2, 5], [5, 0]],
        O: [[1, 5], [4, 3]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[0, 2], [5, 3]],
        G: [[1, 1], [4, 4]],
        B: [[0, 5], [3, 0]],
        Y: [[2, 2], [5, 5]],
        O: [[1, 4], [4, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[1, 0], [4, 5]],
        G: [[0, 3], [5, 2]],
        B: [[1, 4], [4, 1]],
        Y: [[0, 1], [5, 4]],
        O: [[2, 5], [3, 0]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[0, 4], [5, 1]],
        G: [[1, 2], [4, 5]],
        B: [[0, 0], [5, 4]],
        Y: [[2, 0], [3, 4]],
        O: [[1, 5], [4, 0]],
      },
      solution: null,
    },
  ];

  return Array.from({ length: 30 }, (_, index) => {
    if (index < curatedFirst14.length) {
      const curatedLevel = curatedFirst14[index];
      return {
        pairs: Object.fromEntries(
          Object.entries(curatedLevel.pairs).map(([color, points]) => [
            color,
            points.map(([row, col]) => [row, col]),
          ])
        ),
        solution: null,
      };
    }

    const curatedLateIndex = index - curatedFirst14.length;
    if (curatedLateIndex >= 0 && curatedLateIndex < curated15to29.length) {
      const curatedLevel = curated15to29[curatedLateIndex];
      return {
        pairs: Object.fromEntries(
          Object.entries(curatedLevel.pairs).map(([color, points]) => [
            color,
            points.map(([row, col]) => [row, col]),
          ])
        ),
        solution: null,
      };
    }

    if (index === 29) {
      return {
        pairs: Object.fromEntries(
          Object.entries(curatedLevel30.pairs).map(([color, points]) => [
            color,
            points.map(([row, col]) => [row, col]),
          ])
        ),
        solution: null,
      };
    }

    const template = templates[index % templates.length];
    return {
      pairs: Object.fromEntries(
        Object.entries(template.pairs).map(([color, points]) => [
          color,
          points.map(([row, col]) => [row, col]),
        ])
      ),
      solution: null,
    };
  });
}

const LEVELS_6X6 = build6x6Levels();

function build7x7Levels() {
  const curatedLevels = [
    {
      pairs: {
        R: [[0, 0], [3, 4]],
        Y: [[0, 5], [1, 0]],
        G: [[0, 6], [4, 0]],
        B: [[2, 1], [4, 4]],
        O: [[2, 2], [4, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        O: [[1, 1], [3, 1]],
        M: [[1, 2], [5, 1]],
        R: [[1, 3], [2, 6]],
        C: [[1, 4], [6, 0]],
        P: [[1, 5], [6, 6]],
        G: [[2, 2], [4, 3]],
        B: [[3, 2], [4, 1]],
        Y: [[4, 5], [6, 3]],
      },
      solution: null,
    },
    {
      pairs: {
        Y: [[0, 5], [4, 6]],
        O: [[0, 6], [3, 6]],
        R: [[1, 1], [1, 5]],
        B: [[1, 2], [1, 4]],
        C: [[2, 4], [3, 3]],
        G: [[4, 0], [5, 6]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[1, 5], [2, 1]],
        G: [[2, 0], [2, 3]],
        O: [[2, 2], [6, 6]],
        C: [[3, 0], [6, 0]],
        P: [[3, 1], [6, 1]],
        Y: [[3, 6], [4, 3]],
        B: [[5, 5], [6, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[1, 0], [2, 3]],
        P: [[1, 1], [4, 0]],
        C: [[1, 2], [3, 3]],
        R: [[1, 5], [5, 5]],
        O: [[3, 1], [5, 4]],
        Y: [[3, 4], [5, 0]],
        G: [[5, 1], [5, 3]],
      },
      solution: null,
    },
    {
      pairs: {
        C: [[0, 1], [6, 0]],
        O: [[1, 1], [6, 2]],
        B: [[2, 4], [6, 4]],
        R: [[3, 3], [5, 5]],
        Y: [[4, 3], [6, 3]],
        G: [[5, 2], [6, 5]],
      },
      solution: null,
    },
    {
      pairs: {
        O: [[0, 5], [1, 0]],
        R: [[0, 6], [3, 6]],
        C: [[1, 1], [4, 6]],
        G: [[1, 2], [4, 5]],
        B: [[2, 4], [2, 6]],
        Y: [[3, 1], [5, 5]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[0, 4], [6, 5]],
        C: [[0, 6], [1, 1]],
        O: [[1, 6], [5, 1]],
        Y: [[3, 2], [5, 2]],
        R: [[3, 3], [3, 6]],
        B: [[4, 3], [4, 6]],
        P: [[5, 3], [6, 6]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[1, 0], [2, 1]],
        R: [[1, 1], [1, 5]],
        O: [[2, 0], [4, 2]],
        B: [[3, 1], [3, 3]],
        Y: [[4, 1], [4, 5]],
      },
      solution: null,
    },
    {
      pairs: {
        C: [[1, 0], [2, 3]],
        R: [[1, 1], [1, 3]],
        G: [[1, 5], [2, 4]],
        P: [[2, 2], [6, 4]],
        Y: [[3, 2], [5, 4]],
        B: [[3, 6], [5, 6]],
        O: [[4, 2], [6, 6]],
      },
      solution: null,
    },
    {
      pairs: {
        C: [[0, 0], [6, 1]],
        B: [[0, 1], [3, 4]],
        Y: [[0, 2], [2, 3]],
        G: [[1, 5], [4, 4]],
        R: [[2, 1], [4, 2]],
        O: [[3, 1], [6, 6]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[1, 0], [6, 0]],
        Y: [[2, 2], [3, 4]],
        O: [[4, 2], [5, 4]],
        B: [[4, 4], [5, 1]],
        R: [[5, 0], [5, 5]],
      },
      solution: null,
    },
    {
      pairs: {
        C: [[0, 0], [1, 6]],
        Y: [[1, 0], [2, 6]],
        P: [[2, 0], [2, 2]],
        O: [[2, 3], [4, 5]],
        G: [[2, 4], [3, 6]],
        M: [[3, 0], [5, 1]],
        R: [[3, 2], [4, 6]],
        B: [[4, 0], [6, 6]],
      },
      solution: null,
    },
    {
      pairs: {
        P: [[0, 1], [6, 2]],
        R: [[0, 2], [6, 3]],
        O: [[1, 2], [5, 2]],
        B: [[1, 3], [1, 5]],
        G: [[2, 2], [3, 5]],
        C: [[3, 2], [4, 5]],
        Y: [[3, 3], [4, 4]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[0, 6], [6, 5]],
        O: [[1, 5], [2, 1]],
        R: [[1, 6], [5, 4]],
        G: [[3, 3], [4, 2]],
        C: [[3, 4], [6, 6]],
        Y: [[4, 4], [5, 5]],
      },
      solution: null,
    },
    {
      pairs: {
        O: [[0, 0], [4, 0]],
        G: [[0, 2], [0, 4]],
        B: [[0, 5], [3, 6]],
        Y: [[1, 0], [4, 2]],
        P: [[1, 2], [2, 4]],
        C: [[1, 5], [3, 4]],
        R: [[4, 1], [5, 5]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[2, 1], [4, 5]],
        B: [[2, 2], [2, 4]],
        C: [[3, 1], [4, 4]],
        G: [[4, 3], [5, 0]],
        Y: [[5, 1], [5, 4]],
        O: [[5, 3], [6, 6]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[0, 0], [4, 4]],
        R: [[0, 4], [5, 3]],
        C: [[0, 6], [4, 3]],
        O: [[1, 6], [3, 3]],
        Y: [[3, 4], [6, 6]],
        B: [[4, 5], [6, 5]],
      },
      solution: null,
    },
    {
      pairs: {
        P: [[0, 0], [1, 3]],
        G: [[0, 2], [3, 4]],
        B: [[0, 5], [6, 1]],
        Y: [[1, 0], [2, 3]],
        R: [[1, 5], [3, 3]],
        C: [[4, 0], [5, 5]],
        O: [[4, 1], [6, 0]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[0, 0], [1, 4]],
        G: [[1, 0], [3, 3]],
        Y: [[2, 0], [3, 1]],
        C: [[3, 0], [6, 0]],
        O: [[0, 4], [2, 3]],
        R: [[1, 5], [5, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[0, 0], [1, 4]],
        G: [[1, 0], [3, 3]],
        Y: [[2, 0], [3, 1]],
        C: [[3, 0], [6, 0]],
        O: [[0, 4], [2, 3]],
        R: [[1, 5], [5, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        G: [[0, 0], [0, 2]],
        R: [[0, 3], [1, 2]],
        O: [[1, 3], [4, 1]],
        B: [[2, 1], [3, 3]],
        Y: [[2, 4], [3, 1]],
      },
      solution: null,
    },
    {
      pairs: {
        Y: [[0, 3], [6, 0]],
        C: [[1, 5], [4, 5]],
        G: [[3, 5], [4, 3]],
        R: [[3, 6], [6, 1]],
        B: [[4, 6], [6, 6]],
        O: [[5, 5], [6, 2]],
      },
      solution: null,
    },
    {
      pairs: {
        R: [[0, 6], [4, 5]],
        P: [[1, 1], [2, 4]],
        B: [[2, 1], [3, 4]],
        O: [[3, 1], [3, 5]],
        Y: [[3, 2], [5, 5]],
        C: [[4, 1], [6, 2]],
        G: [[5, 1], [5, 6]],
      },
      solution: null,
    },
    {
      pairs: {
        B: [[1, 0], [3, 6]],
        G: [[1, 1], [5, 3]],
        Y: [[2, 0], [2, 4]],
        R: [[4, 1], [6, 5]],
        O: [[5, 5], [6, 0]],
      },
      solution: null,
    },
  ];

  return Array.from({ length: 30 }, (_, index) => {
    const template = curatedLevels[index % curatedLevels.length];
    return {
      pairs: Object.fromEntries(
        Object.entries(template.pairs).map(([color, points]) => [
          color,
          points.map(([row, col]) => [row, col]),
        ])
      ),
      solution: null,
    };
  });
}

const LEVELS_7X7 = build7x7Levels();

const PACKS = [
  { id: "5x5", title: "5x5 - Easy", size: 5, levels: LEVELS_5X5 },
  { id: "6x6", title: "6x6 - Classic", size: 6, levels: LEVELS_6X6 },
  { id: "7x7", title: "7x7 - Medium", size: 7, levels: LEVELS_7X7 },
];

const gridEl = document.getElementById("grid");
const moveValueEl = document.getElementById("moveValue");
const levelValueEl = document.getElementById("levelValue");
const progressTextEl = document.getElementById("progressText");
const levelsBtn = document.getElementById("levelsBtn");
const resetBtn = document.getElementById("resetBtn");
const levelsModalEl = document.getElementById("levelsModal");
const levelsCarouselEl = document.getElementById("levelsCarousel");
const carouselDotsEl = document.getElementById("carouselDots");
const closeLevelsBtn = document.getElementById("closeLevelsBtn");
const modalEl = document.getElementById("levelCompleteModal");
const finalMovesEl = document.getElementById("finalMoves");
const nextLevelBtn = document.getElementById("nextLevelBtn");
const STORAGE_KEY_PREFIX = "color-grid-connect-progress";

let currentLevel = 0;
let moveCount = 0;
let board = [];
let paths = {};
let activeColor = null;
let activePath = [];
let dragging = false;
let justStarted = false;
let activePackIndex = 0;
let currentGridSize = DEFAULT_GRID_SIZE;
let progress = {
  unlocked: 1,
  completed: [],
};

function getActivePack() {
  return PACKS[activePackIndex];
}

function getActiveLevels() {
  return getActivePack().levels;
}

function getProgressStorageKey() {
  return `${STORAGE_KEY_PREFIX}-${getActivePack().id}`;
}



function init() {
  loadProgress();
  currentGridSize = getActivePack().size;
  currentLevel = Math.max(0, Math.min(progress.unlocked - 1, getActiveLevels().length - 1));
  setupLevel(currentLevel);
  renderLevelsCarousel();
  wireEvents();
}

function setupLevel(levelIndex) {
  const level = getActiveLevels()[levelIndex];
  currentGridSize = getActivePack().size;
  gridEl.style.setProperty("--grid-size", String(currentGridSize));
  board = Array.from({ length: currentGridSize }, () =>
    Array.from({ length: currentGridSize }, () => ({
      endpointColor: null,
      pathColor: null,
    }))
  );
  paths = {};
  moveCount = 0;
  activeColor = null;
  activePath = [];
  dragging = false;
  justStarted = false;
  modalEl.classList.add("hidden");

  Object.entries(level.pairs).forEach(([color, points]) => {
    const [[r1, c1], [r2, c2]] = points;
    board[r1][c1].endpointColor = color;
    board[r2][c2].endpointColor = color;
    paths[color] = [];
  });

  levelValueEl.textContent = String(levelIndex + 1);
  moveValueEl.textContent = "0";
  progressTextEl.textContent = "Fill every cell to win";
  buildGridDom();
  renderLevelsCarousel();
}

/** Stable button nodes per cell — rebuilt only when the level changes. */
let cellDom = [];

function buildGridDom() {
  gridEl.innerHTML = "";
  cellDom = [];
  for (let row = 0; row < currentGridSize; row += 1) {
    cellDom[row] = [];
    for (let col = 0; col < currentGridSize; col += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("aria-label", `Cell ${row + 1}, ${col + 1}`);
      gridEl.appendChild(cell);
      cellDom[row][col] = cell;
    }
  }
  syncGridDom();
}

function syncGridDom() {
  for (let row = 0; row < currentGridSize; row += 1) {
    for (let col = 0; col < currentGridSize; col += 1) {
      const el = cellDom[row][col];
      if (!el) continue;
      const cellData = board[row][col];

      el.classList.toggle("endpoint", !!cellData.endpointColor);
      el.classList.toggle("path", !!cellData.pathColor);
      el.classList.toggle("connected", isConnectedEndpoint(row, col));

      const drawColorKey = cellData.pathColor || cellData.endpointColor;
      if (drawColorKey) {
        el.style.setProperty("--color", COLOR_MAP[drawColorKey]);
      } else {
        el.style.removeProperty("--color");
      }

      if (cellData.pathColor) {
        el.style.background = `color-mix(in srgb, ${COLOR_MAP[cellData.pathColor]} 28%, rgba(8, 14, 34, 0.88))`;
        el.style.boxShadow = `0 0 16px color-mix(in srgb, ${COLOR_MAP[cellData.pathColor]} 42%, transparent), inset 0 0 0 1px rgba(255,255,255,0.12)`;
      } else {
        el.style.removeProperty("background");
        el.style.removeProperty("box-shadow");
      }
    }
  }
}

function wireEvents() {
  const getCellAtPoint = (clientX, clientY) => {
    let el = document.elementFromPoint(clientX, clientY);
    while (el && el !== gridEl) {
      if (el.classList && el.classList.contains("cell")) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  const startDraw = (element) => {
    if (!element || !element.classList.contains("cell")) {
      return;
    }
    const row = Number(element.dataset.row);
    const col = Number(element.dataset.col);
    const color = board[row][col].endpointColor;
    if (!color) {
      return;
    }
    dragging = true;
    justStarted = true;
    activeColor = color;
    activePath = [{ row, col }];
    clearPathColor(activeColor);
    paintPath(activeColor, activePath);
    syncGridDom();
  };

  const continueDraw = (element) => {
    if (!dragging || !activeColor || !element || !element.classList.contains("cell")) {
      return;
    }
    const row = Number(element.dataset.row);
    const col = Number(element.dataset.col);
    tryExtendPath(row, col);
  };

  const stopDraw = () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    justStarted = false;
    if (activeColor && activePath.length > 0) {
      paths[activeColor] = [...activePath];
      moveCount += 1;
      moveValueEl.textContent = String(moveCount);
    }
    activeColor = null;
    activePath = [];
    checkWin();
  };

  gridEl.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (event.target.hasPointerCapture && event.target.hasPointerCapture(event.pointerId)) {
      event.target.releasePointerCapture(event.pointerId);
    }
    startDraw(event.target);
  });

  gridEl.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }
    event.preventDefault();
    const target = getCellAtPoint(event.clientX, event.clientY);
    continueDraw(target);
  });

  gridEl.addEventListener("pointerup", stopDraw);
  gridEl.addEventListener("pointercancel", stopDraw);
  gridEl.addEventListener("pointerleave", () => {
    justStarted = false;
  });
  window.addEventListener("pointerup", stopDraw);

  resetBtn.addEventListener("click", () => setupLevel(currentLevel));
  levelsBtn.addEventListener("click", openLevelsModal);
  
  const startGameBtn = document.getElementById("startGameBtn");
  if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
      document.getElementById("splashScreen").classList.add("hidden");
      openLevelsModal();
    });
  }
  
  const helpBtn = document.getElementById("helpBtn");
  if (helpBtn) {
    helpBtn.addEventListener("click", () => TutorialManager.start());
  }

  closeLevelsBtn.addEventListener("click", closeLevelsModal);

  levelsCarouselEl.addEventListener("scroll", () => {
    const scrollLeft = levelsCarouselEl.scrollLeft;
    const slideWidth = levelsCarouselEl.clientWidth;
    if (slideWidth > 0) {
      const activeIndex = Math.round(scrollLeft / slideWidth);
      Array.from(carouselDotsEl.children).forEach((dot, index) => {
        dot.classList.toggle("active", index === activeIndex);
      });
    }
  });

  levelsModalEl.addEventListener("click", (event) => {
    if (event.target === levelsModalEl) {
      closeLevelsModal();
    }
  });

  nextLevelBtn.addEventListener("click", () => {
    currentLevel = Math.min(currentLevel + 1, getActiveLevels().length - 1);
    setupLevel(currentLevel);
  });
}

function tryExtendPath(row, col) {
  const last = activePath[activePath.length - 1];
  const dr = Math.abs(last.row - row);
  const dc = Math.abs(last.col - col);
  if (dr + dc !== 1) {
    return;
  }

  const existingIndex = activePath.findIndex((p) => p.row === row && p.col === col);
  if (existingIndex !== -1) {
    // Dragging back along own path trims it.
    activePath = activePath.slice(0, existingIndex + 1);
    repaintBoardFromAllPaths();
    paintPath(activeColor, activePath);
    syncGridDom();
    return;
  }

  const cell = board[row][col];
  if (cell.pathColor && cell.pathColor !== activeColor) {
    return;
  }

  if (cell.endpointColor && cell.endpointColor !== activeColor) {
    return;
  }

  if (justStarted && cell.endpointColor === activeColor && activePath.length === 1) {
    justStarted = false;
    return;
  }

  activePath.push({ row, col });
  repaintBoardFromAllPaths();
  paintPath(activeColor, activePath);
  syncGridDom();
}

function clearPathColor(color) {
  for (let r = 0; r < currentGridSize; r += 1) {
    for (let c = 0; c < currentGridSize; c += 1) {
      if (board[r][c].pathColor === color) {
        board[r][c].pathColor = null;
      }
    }
  }
}

function paintPath(color, path) {
  path.forEach(({ row, col }) => {
    board[row][col].pathColor = color;
  });
}

function repaintBoardFromAllPaths() {
  for (let r = 0; r < currentGridSize; r += 1) {
    for (let c = 0; c < currentGridSize; c += 1) {
      board[r][c].pathColor = null;
    }
  }
  Object.entries(paths).forEach(([color, path]) => {
    paintPath(color, path);
  });
}

function isConnectedEndpoint(row, col) {
  const endpointColor = board[row][col].endpointColor;
  if (!endpointColor) {
    return false;
  }
  const [start, end] = getActiveLevels()[currentLevel].pairs[endpointColor];
  const path = endpointColor === activeColor && dragging ? activePath : paths[endpointColor];
  if (!path || path.length < 2) {
    return false;
  }
  const hasStart = path.some((p) => p.row === start[0] && p.col === start[1]);
  const hasEnd = path.some((p) => p.row === end[0] && p.col === end[1]);
  return hasStart && hasEnd;
}

function checkWin() {
  const levelPairs = getActiveLevels()[currentLevel].pairs;
  const allConnected = Object.entries(levelPairs).every(([color, points]) => {
    const [a, b] = points;
    const path = paths[color];
    if (!path || path.length < 2) {
      return false;
    }
    const hasA = path.some((p) => p.row === a[0] && p.col === a[1]);
    const hasB = path.some((p) => p.row === b[0] && p.col === b[1]);
    return hasA && hasB;
  });

  if (!allConnected) {
    return;
  }

  const allFilled = board.every((row) => row.every((cell) => cell.pathColor));
  if (!allFilled) {
    progressTextEl.textContent = "All pairs connected. Fill remaining cells.";
    return;
  }

  progressTextEl.textContent = "Perfect solve!";
  markLevelCompleted(currentLevel);
  finalMovesEl.textContent = String(moveCount);
  modalEl.classList.remove("hidden");
}

function loadProgress() {
  progress = {
    unlocked: 1,
    completed: [],
  };
  try {
    const raw = localStorage.getItem(getProgressStorageKey());
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed?.unlocked === "number" && Array.isArray(parsed?.completed)) {
      progress = {
        unlocked: Math.max(1, Math.min(parsed.unlocked, getActiveLevels().length)),
        completed: parsed.completed.filter(
          (index) => Number.isInteger(index) && index >= 0 && index < getActiveLevels().length
        ),
      };
    }
  } catch (_error) {
    // Keep defaults if storage is unavailable/corrupted.
  }
}

function saveProgress() {
  localStorage.setItem(getProgressStorageKey(), JSON.stringify(progress));
}

function markLevelCompleted(levelIndex) {
  if (!progress.completed.includes(levelIndex)) {
    progress.completed.push(levelIndex);
  }
  progress.unlocked = Math.max(progress.unlocked, Math.min(levelIndex + 2, getActiveLevels().length));
  saveProgress();
  renderLevelsCarousel();

  // Notify parent window for credit rewards
  if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'LEVEL_COMPLETED', level: levelIndex }, '*');
  }
}

function openLevelsModal() {
  renderLevelsCarousel();
  levelsModalEl.classList.remove("hidden");
}

function closeLevelsModal() {
  levelsModalEl.classList.add("hidden");
}

function getPackProgress(pack) {
  let packProgress = { unlocked: 1, completed: [] };
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}-${pack.id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.unlocked === "number" && Array.isArray(parsed?.completed)) {
        packProgress = {
          unlocked: Math.max(1, Math.min(parsed.unlocked, pack.levels.length)),
          completed: parsed.completed.filter(
            (index) => Number.isInteger(index) && index >= 0 && index < pack.levels.length
          ),
        };
      }
    }
  } catch (e) {}
  return packProgress;
}

function renderLevelsCarousel() {
  levelsCarouselEl.innerHTML = "";
  carouselDotsEl.innerHTML = "";
  PACKS.forEach((pack, packIndex) => {
    const packProgress = getPackProgress(pack);

    const slide = document.createElement("div");
    slide.className = `carousel-slide pack-${pack.id}`;
    
    const title = document.createElement("h3");
    title.textContent = pack.title;
    slide.appendChild(title);
    
    const grid = document.createElement("div");
    grid.className = "levels-grid";
    
    for (let levelIndex = 0; levelIndex < pack.levels.length; levelIndex += 1) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "level-tile";
      
      const isCompleted = packProgress.completed.includes(levelIndex);
      const isCurrent = packIndex === activePackIndex && levelIndex === currentLevel;
      const isLocked = levelIndex + 1 > packProgress.unlocked;

      if (isCompleted) {
        tile.classList.add("completed");
      }
      if (isCurrent) {
        tile.classList.add("current");
      }
      if (isLocked) {
        tile.classList.add("locked");
        tile.disabled = true;
        tile.setAttribute("aria-label", `Level ${levelIndex + 1} locked`);
      } else {
        tile.setAttribute("aria-label", `Open level ${levelIndex + 1}`);
        tile.addEventListener("click", () => {
          activePackIndex = packIndex;
          currentLevel = levelIndex;
          loadProgress();
          setupLevel(currentLevel);
          closeLevelsModal();
        });
      }
      
      tile.textContent = String(levelIndex + 1);
      grid.appendChild(tile);
    }
    
    slide.appendChild(grid);
    levelsCarouselEl.appendChild(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    if (packIndex === activePackIndex) {
      dot.classList.add("active");
    }
    dot.setAttribute("aria-label", `Go to ${pack.title}`);
    dot.addEventListener("click", () => {
      levelsCarouselEl.children[packIndex].scrollIntoView({ behavior: 'smooth', inline: 'start' });
    });
    carouselDotsEl.appendChild(dot);
  });
  
  // Scroll to active pack slide if modal is opened
  if (!levelsModalEl.classList.contains("hidden")) {
    setTimeout(() => {
      const activeSlide = levelsCarouselEl.children[activePackIndex];
      if (activeSlide) {
        activeSlide.scrollIntoView({ behavior: 'instant', inline: 'start' });
      }
    }, 0);
  }
}

function getActivePack() {
  return PACKS[activePackIndex];
}

function getActiveLevels() {
  return getActivePack().levels;
}

function getProgressStorageKey() {
  return `${STORAGE_KEY_PREFIX}-${getActivePack().id}`;
}

// --- TUTORIAL LOGIC ---
const TutorialManager = {
  steps: [
    {
      title: "How to Play",
      desc: "Connect matching colors to fill the grid.",
      setup: () => {}
    },
    {
      title: "Start Point",
      desc: "Start from one colored dot.",
      setup: () => {
        TutorialManager.focusCell(0, 0, COLOR_MAP.B);
      }
    },
    {
      title: "Guided Drag",
      desc: "Drag to connect matching colors. Move only in straight grid paths.",
      setup: async () => {
        TutorialManager.focusCell(0, 0, COLOR_MAP.B);
        await TutorialManager.delay(600);
        await TutorialManager.animatePath(0, 0, [[1,0], [2,0], [3,0], [4,0], [4,1]], 'B');
      }
    },
    {
      title: "Rule: No Overlap",
      desc: "Paths cannot overlap or cross each other.",
      setup: async () => {
        TutorialManager.clearSimulated();
        TutorialManager.simulatePath([[0,0], [1,0], [2,0], [3,0], [4,0], [4,1]], 'B');
        
        TutorialManager.focusCell(1, 3, COLOR_MAP.Y);
        await TutorialManager.delay(600);
        await TutorialManager.animateWrongPath(1, 3, [[1,2], [1,1], [1,0]]); // Intentionally crossing B
      }
    },
    {
      title: "Connect All",
      desc: "Complete all color connections. Leave no cell empty.",
      setup: async () => {
        TutorialManager.clearSimulated();
        TutorialManager.simulatePath([[0,0], [1,0], [2,0], [3,0], [4,0], [4,1]], 'B');
        
        TutorialManager.focusCell(1, 3, COLOR_MAP.Y);
        await TutorialManager.delay(600);
        await TutorialManager.animatePath(1, 3, [[2,3], [2,2]], 'Y');
      }
    },
    {
      title: "Fill the Grid",
      desc: "Fill every cell to win! Tap Next to close tutorial.",
      setup: async () => {
        TutorialManager.clearSimulated();
        // Fully solve Level 1 visually
        TutorialManager.simulatePath([[0,0], [1,0], [2,0], [3,0], [4,0], [4,1]], 'B');
        TutorialManager.simulatePath([[0,3], [0,2], [0,1], [1,1], [2,1], [3,1]], 'R');
        TutorialManager.simulatePath([[1,3], [2,3], [2,2]], 'Y');
        TutorialManager.simulatePath([[0,4], [1,4], [2,4], [3,4], [3,3], [3,2]], 'O');
        TutorialManager.simulatePath([[4,4], [4,3], [4,2]], 'G');
        
        // Add win glow
        document.querySelectorAll('.cell').forEach(c => {
          c.classList.add('tut-focus');
        });
      }
    }
  ],
  currentStep: 0,
  overlayEl: null,
  titleEl: null,
  descEl: null,
  stepEl: null,
  dotsEl: null,
  isAnimating: false,
  
  init() {
    this.overlayEl = document.getElementById("tutorialOverlay");
    this.titleEl = document.getElementById("tutTitle");
    this.descEl = document.getElementById("tutDesc");
    this.stepEl = document.getElementById("tutStepIndicator");
    this.dotsEl = document.getElementById("tutDots");
    
    document.getElementById("tutSkipBtn")?.addEventListener("click", () => this.end());
    document.getElementById("tutNextBtn")?.addEventListener("click", () => {
      if(!this.isAnimating) this.nextStep();
    });
  },
  
  start() {
    if(!this.overlayEl) this.init();
    
    // Switch to 5x5 Easy Pack, Level 1 for tutorial context
    if (activePackIndex !== 0 || currentLevel !== 0) {
      activePackIndex = 0;
      currentLevel = 0;
      setupLevel(0);
    }
    
    this.overlayEl.classList.remove("hidden");
    this.currentStep = 0;
    this.renderStep();
  },
  
  end() {
    this.overlayEl.classList.add("hidden");
    this.clearSimulated();
  },
  
  nextStep() {
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.end();
    } else {
      this.renderStep();
    }
  },
  
  async renderStep() {
    this.isAnimating = true;
    const step = this.steps[this.currentStep];
    this.titleEl.textContent = step.title;
    this.descEl.textContent = step.desc;
    this.stepEl.textContent = `Step ${this.currentStep + 1}/${this.steps.length}`;
    
    // Move tutorial box to the side starting from the Guided Drag step (index 2)
    const uiEl = document.querySelector(".tutorial-ui");
    if (uiEl) {
      if (this.currentStep >= 2) {
        uiEl.classList.add("side-mode");
      } else {
        uiEl.classList.remove("side-mode");
      }
    }
    
    this.dotsEl.innerHTML = '';
    for(let i=0; i<this.steps.length; i++) {
      const dot = document.createElement("div");
      dot.className = `dot ${i === this.currentStep ? 'active' : ''}`;
      this.dotsEl.appendChild(dot);
    }
    
    this.clearSimulated();
    
    if (step.setup) {
      await step.setup();
    }
    this.isAnimating = false;
  },
  
  getCell(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  },
  
  clearSimulated() {
    document.querySelectorAll('.cell.tut-focus, .cell.tut-path-simulate, .cell.tut-wrong').forEach(el => {
      el.classList.remove('tut-focus', 'tut-path-simulate', 'tut-wrong');
      el.style.removeProperty('--color');
    });
  },
  
  focusCell(row, col, hexColor) {
    const cell = this.getCell(row, col);
    if(cell) {
      cell.classList.add('tut-focus');
      cell.style.setProperty('--color', hexColor);
    }
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  async animatePath(startRow, startCol, path, colorKey) {
    let r = startRow, c = startCol;
    for (const [nr, nc] of path) {
      await this.delay(400);
      r = nr; c = nc;
      const cell = this.getCell(r, c);
      if(cell) {
        cell.classList.add('tut-path-simulate');
        cell.style.setProperty('--color', COLOR_MAP[colorKey]);
      }
    }
  },
  
  simulatePath(path, colorKey) {
    for (const [r, c] of path) {
      const cell = this.getCell(r, c);
      if(cell) {
        cell.classList.add('tut-path-simulate');
        cell.style.setProperty('--color', COLOR_MAP[colorKey]);
      }
    }
  },
  
  async animateWrongPath(startRow, startCol, path) {
    let r = startRow, c = startCol;
    for (const [nr, nc] of path) {
      await this.delay(400);
      r = nr; c = nc;
      const cell = this.getCell(r, c);
      if(cell) {
        cell.classList.add('tut-wrong');
      }
    }
    await this.delay(600);
  }
};
TutorialManager.init();
init();
