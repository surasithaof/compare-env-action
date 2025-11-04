import type { EnvChange } from "./types";
/**
 * Parses the diff content to extract environment variable changes.
 * @param diffContent - parse the diff content string to extract environment variable changes
 * @returns An object containing added, removed, and modified environment variables.
 */
export declare function parseChanges(diffContent: string): EnvChange;
/**
 * Checks if there are any changes in the EnvChange object.
 * @param changes - An object containing added, removed, and modified environment variables.
 * @returns A boolean indicating if there are any changes.
 */
export declare function hasChanges(changes: EnvChange): boolean;
/**
 * Parses the diff content assuming all lines are new additions.
 * @param diffContent - The diff content string to parse.
 * @returns An object containing added environment variables.
 */
export declare function parseAllNewEnv(diffContent: string): EnvChange;
