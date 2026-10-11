export const cleanProblemTitle = (title) =>
    title.trim().replace(/\s+/g, " ");

export const createProblemTitleKey = (title) =>
    cleanProblemTitle(title).toLowerCase();
