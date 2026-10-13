export const publicProblemSummarySelect = {
    id: true,
    title: true,
    difficulty: true,
    isDemo: true,
    tags: true,
};

export const publicProblemSelect = {
    ...publicProblemSummarySelect,
    description: true,
    examples: true,
    constraints: true,
    hints: true,
    codeSnippet: true,
    createdAt: true,
    updatedAt: true,
};
