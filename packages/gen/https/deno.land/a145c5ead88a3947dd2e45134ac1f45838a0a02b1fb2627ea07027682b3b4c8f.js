import { globToRegExp, isAbsolute, isGlob, joinGlobs, resolve, SEP_PATTERN, } from "../path/mod.ts";
import { _createWalkEntry, _createWalkEntrySync, walk, walkSync, } from "./walk.ts";
import { assert } from "../_util/assert.ts";
import { isWindows } from "../_util/os.ts";
function split(path) {
    const s = SEP_PATTERN.source;
    const segments = path
        .replace(new RegExp(`^${s}|${s}$`, "g"), "")
        .split(SEP_PATTERN);
    const isAbsolute_ = isAbsolute(path);
    return {
        segments,
        isAbsolute: isAbsolute_,
        hasTrailingSep: !!path.match(new RegExp(`${s}$`)),
        winRoot: isWindows && isAbsolute_ ? segments.shift() : undefined,
    };
}
function throwUnlessNotFound(error) {
    if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
    }
}
function comparePath(a, b) {
    if (a.path < b.path)
        return -1;
    if (a.path > b.path)
        return 1;
    return 0;
}
export async function* expandGlob(glob, { root = Deno.cwd(), exclude = [], includeDirs = true, extended = true, globstar = false, caseInsensitive, } = {}) {
    const globOptions = { extended, globstar, caseInsensitive };
    const absRoot = resolve(root);
    const resolveFromRoot = (path) => resolve(absRoot, path);
    const excludePatterns = exclude
        .map(resolveFromRoot)
        .map((s) => globToRegExp(s, globOptions));
    const shouldInclude = (path) => !excludePatterns.some((p) => !!path.match(p));
    const { segments, isAbsolute: isGlobAbsolute, hasTrailingSep, winRoot } = split(glob);
    let fixedRoot = isGlobAbsolute
        ? (winRoot != undefined ? winRoot : "/")
        : absRoot;
    while (segments.length > 0 && !isGlob(segments[0])) {
        const seg = segments.shift();
        assert(seg != null);
        fixedRoot = joinGlobs([fixedRoot, seg], globOptions);
    }
    let fixedRootInfo;
    try {
        fixedRootInfo = await _createWalkEntry(fixedRoot);
    }
    catch (error) {
        return throwUnlessNotFound(error);
    }
    async function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
            return;
        }
        else if (globSegment == "..") {
            const parentPath = joinGlobs([walkInfo.path, ".."], globOptions);
            try {
                if (shouldInclude(parentPath)) {
                    return yield await _createWalkEntry(parentPath);
                }
            }
            catch (error) {
                throwUnlessNotFound(error);
            }
            return;
        }
        else if (globSegment == "**") {
            return yield* walk(walkInfo.path, { skip: excludePatterns });
        }
        const globPattern = globToRegExp(globSegment, globOptions);
        for await (const walkEntry of walk(walkInfo.path, {
            maxDepth: 1,
            skip: excludePatterns,
        })) {
            if (walkEntry.path != walkInfo.path && walkEntry.name.match(globPattern)) {
                yield walkEntry;
            }
        }
    }
    let currentMatches = [fixedRootInfo];
    for (const segment of segments) {
        const nextMatchMap = new Map();
        await Promise.all(currentMatches.map(async (currentMatch) => {
            for await (const nextMatch of advanceMatch(currentMatch, segment)) {
                nextMatchMap.set(nextMatch.path, nextMatch);
            }
        }));
        currentMatches = [...nextMatchMap.values()].sort(comparePath);
    }
    if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry) => entry.isDirectory);
    }
    if (!includeDirs) {
        currentMatches = currentMatches.filter((entry) => !entry.isDirectory);
    }
    yield* currentMatches;
}
export function* expandGlobSync(glob, { root = Deno.cwd(), exclude = [], includeDirs = true, extended = true, globstar = false, caseInsensitive, } = {}) {
    const globOptions = { extended, globstar, caseInsensitive };
    const absRoot = resolve(root);
    const resolveFromRoot = (path) => resolve(absRoot, path);
    const excludePatterns = exclude
        .map(resolveFromRoot)
        .map((s) => globToRegExp(s, globOptions));
    const shouldInclude = (path) => !excludePatterns.some((p) => !!path.match(p));
    const { segments, isAbsolute: isGlobAbsolute, hasTrailingSep, winRoot } = split(glob);
    let fixedRoot = isGlobAbsolute
        ? (winRoot != undefined ? winRoot : "/")
        : absRoot;
    while (segments.length > 0 && !isGlob(segments[0])) {
        const seg = segments.shift();
        assert(seg != null);
        fixedRoot = joinGlobs([fixedRoot, seg], globOptions);
    }
    let fixedRootInfo;
    try {
        fixedRootInfo = _createWalkEntrySync(fixedRoot);
    }
    catch (error) {
        return throwUnlessNotFound(error);
    }
    function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
            return;
        }
        else if (globSegment == "..") {
            const parentPath = joinGlobs([walkInfo.path, ".."], globOptions);
            try {
                if (shouldInclude(parentPath)) {
                    return yield _createWalkEntrySync(parentPath);
                }
            }
            catch (error) {
                throwUnlessNotFound(error);
            }
            return;
        }
        else if (globSegment == "**") {
            return yield* walkSync(walkInfo.path, { skip: excludePatterns });
        }
        const globPattern = globToRegExp(globSegment, globOptions);
        for (const walkEntry of walkSync(walkInfo.path, {
            maxDepth: 1,
            skip: excludePatterns,
        })) {
            if (walkEntry.path != walkInfo.path && walkEntry.name.match(globPattern)) {
                yield walkEntry;
            }
        }
    }
    let currentMatches = [fixedRootInfo];
    for (const segment of segments) {
        const nextMatchMap = new Map();
        for (const currentMatch of currentMatches) {
            for (const nextMatch of advanceMatch(currentMatch, segment)) {
                nextMatchMap.set(nextMatch.path, nextMatch);
            }
        }
        currentMatches = [...nextMatchMap.values()].sort(comparePath);
    }
    if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry) => entry.isDirectory);
    }
    if (!includeDirs) {
        currentMatches = currentMatches.filter((entry) => !entry.isDirectory);
    }
    yield* currentMatches;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwYW5kX2dsb2IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xMjUuMC9mcy9leHBhbmRfZ2xvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBRUwsWUFBWSxFQUNaLFVBQVUsRUFDVixNQUFNLEVBQ04sU0FBUyxFQUNULE9BQU8sRUFDUCxXQUFXLEdBQ1osTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QixPQUFPLEVBQ0wsZ0JBQWdCLEVBQ2hCLG9CQUFvQixFQUNwQixJQUFJLEVBRUosUUFBUSxHQUNULE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUM1QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFnQjNDLFNBQVMsS0FBSyxDQUFDLElBQVk7SUFDekIsTUFBTSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztJQUM3QixNQUFNLFFBQVEsR0FBRyxJQUFJO1NBQ2xCLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUM7U0FDM0MsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3RCLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxPQUFPO1FBQ0wsUUFBUTtRQUNSLFVBQVUsRUFBRSxXQUFXO1FBQ3ZCLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakQsT0FBTyxFQUFFLFNBQVMsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUztLQUNqRSxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsbUJBQW1C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dkQsS0FBSyxNQUFNLFlBQVksSUFBSSxjQUFjLEVBQUU7WUFDekMsS0FBSyxNQUFNLFNBQVMsSUFBSSxZQUFZLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxFQUFFO2dCQUMzRCxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDN0M7U0FDRjtRQUNELGNBQWMsR0FBRyxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxjQUFjLEVBQUU7UUFDbEIsY0FBYyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQ3BDLENBQUMsS0FBZ0IsRUFBVyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FDakQsQ0FBQztLQUNIO0lBQ0QsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNoQixjQUFjLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FDcEMsQ0FBQyxLQUFnQixFQUFXLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQ2xELENBQUM7S0FDSDtJQUNELEtBQUssQ0FBQyxDQUFDLGNBQWMsQ0FBQztBQUN4QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7XG4gIEdsb2JPcHRpb25zLFxuICBnbG9iVG9SZWdFeHAsXG4gIGlzQWJzb2x1dGUsXG4gIGlzR2xvYixcbiAgam9pbkdsb2JzLFxuICByZXNvbHZlLFxuICBTRVBfUEFUVEVSTixcbn0gZnJvbSBcIi4uL3BhdGgvbW9kLnRzXCI7XG5pbXBvcnQge1xuICBfY3JlYXRlV2Fsa0VudHJ5LFxuICBfY3JlYXRlV2Fsa0VudHJ5U3luYyxcbiAgd2FsayxcbiAgV2Fsa0VudHJ5LFxuICB3YWxrU3luYyxcbn0gZnJvbSBcIi4vd2Fsay50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydC50c1wiO1xuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4uL191dGlsL29zLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhwYW5kR2xvYk9wdGlvbnMgZXh0ZW5kcyBPbWl0PEdsb2JPcHRpb25zLCBcIm9zXCI+IHtcbiAgcm9vdD86IHN0cmluZztcbiAgZXhjbHVkZT86IHN0cmluZ1tdO1xuICBpbmNsdWRlRGlycz86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBTcGxpdFBhdGgge1xuICBzZWdtZW50czogc3RyaW5nW107XG4gIGlzQWJzb2x1dGU6IGJvb2xlYW47XG4gIGhhc1RyYWlsaW5nU2VwOiBib29sZWFuO1xuICAvLyBEZWZpbmVkIGZvciBhbnkgYWJzb2x1dGUgV2luZG93cyBwYXRoLlxuICB3aW5Sb290Pzogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBzcGxpdChwYXRoOiBzdHJpbmcpOiBTcGxpdFBhdGgge1xuICBjb25zdCBzID0gU0VQX1BBVFRFUk4uc291cmNlO1xuICBjb25zdCBzZWdtZW50cyA9IHBhdGhcbiAgICAucmVwbGFjZShuZXcgUmVnRXhwKGBeJHtzfXwke3N9JGAsIFwiZ1wiKSwgXCJcIilcbiAgICAuc3BsaXQoU0VQX1BBVFRFUk4pO1xuICBjb25zdCBpc0Fic29sdXRlXyA9IGlzQWJzb2x1dGUocGF0aCk7XG4gIHJldHVybiB7XG4gICAgc2VnbWVudHMsXG4gICAgaXNBYnNvbHV0ZTogaXNBYnNvbHV0ZV8sXG4gICAgaGFzVHJhaWxpbmdTZXA6ICEhcGF0aC5tYXRjaChuZXcgUmVnRXhwKGAke3N9JGApKSxcbiAgICB3aW5Sb290OiBpc1dpbmRvd3MgJiYgaXNBYnNvbHV0ZV8gPyBzZWdtZW50cy5zaGlmdCgpIDogdW5kZWZpbmVkLFxuICB9O1xufVxuXG5mdW5jdGlvbiB0aHJvd1VubGVzc05vdEZvdW5kKGVycm9yOiB1bmtub3duKTogdm9pZCB7XG4gIGlmICghKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29tcGFyZVBhdGgoYTogV2Fsa0VudHJ5LCBiOiBXYWxrRW50cnkpOiBudW1iZXIge1xuICBpZiAoYS5wYXRoIDwgYi5wYXRoKSByZXR1cm4gLTE7XG4gIGlmIChhLnBhdGggPiBiLnBhdGgpIHJldHVybiAxO1xuICByZXR1cm4gMDtcbn1cblxuLyoqIEV4cGFuZCB0aGUgZ2xvYiBzdHJpbmcgZnJvbSB0aGUgc3BlY2lmaWVkIGByb290YCBkaXJlY3RvcnkgYW5kIHlpZWxkIGVhY2hcbiAqIHJlc3VsdCBhcyBhIGBXYWxrRW50cnlgIG9iamVjdC5cbiAqXG4gKiBTZWUgW2BnbG9iVG9SZWdFeHAoKWBdKC4uL3BhdGgvZ2xvYi50cyNnbG9iVG9SZWdFeHApIGZvciBkZXRhaWxzIG9uIHN1cHBvcnRlZFxuICogc3ludGF4LlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGB0c1xuICogICAgICBpbXBvcnQgeyBleHBhbmRHbG9iIH0gZnJvbSBcIi4vZXhwYW5kX2dsb2IudHNcIjtcbiAqICAgICAgZm9yIGF3YWl0IChjb25zdCBmaWxlIG9mIGV4cGFuZEdsb2IoXCIqKlxcLyoudHNcIikpIHtcbiAqICAgICAgICBjb25zb2xlLmxvZyhmaWxlKTtcbiAqICAgICAgfVxuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogZXhwYW5kR2xvYihcbiAgZ2xvYjogc3RyaW5nLFxuICB7XG4gICAgcm9vdCA9IERlbm8uY3dkKCksXG4gICAgZXhjbHVkZSA9IFtdLFxuICAgIGluY2x1ZGVEaXJzID0gdHJ1ZSxcbiAgICBleHRlbmRlZCA9IHRydWUsXG4gICAgZ2xvYnN0YXIgPSBmYWxzZSxcbiAgICBjYXNlSW5zZW5zaXRpdmUsXG4gIH06IEV4cGFuZEdsb2JPcHRpb25zID0ge30sXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8V2Fsa0VudHJ5PiB7XG4gIGNvbnN0IGdsb2JPcHRpb25zOiBHbG9iT3B0aW9ucyA9IHsgZXh0ZW5kZWQsIGdsb2JzdGFyLCBjYXNlSW5zZW5zaXRpdmUgfTtcbiAgY29uc3QgYWJzUm9vdCA9IHJlc29sdmUocm9vdCk7XG4gIGNvbnN0IHJlc29sdmVGcm9tUm9vdCA9IChwYXRoOiBzdHJpbmcpOiBzdHJpbmcgPT4gcmVzb2x2ZShhYnNSb290LCBwYXRoKTtcbiAgY29uc3QgZXhjbHVkZVBhdHRlcm5zID0gZXhjbHVkZVxuICAgIC5tYXAocmVzb2x2ZUZyb21Sb290KVxuICAgIC5tYXAoKHM6IHN0cmluZyk6IFJlZ0V4cCA9PiBnbG9iVG9SZWdFeHAocywgZ2xvYk9wdGlvbnMpKTtcbiAgY29uc3Qgc2hvdWxkSW5jbHVkZSA9IChwYXRoOiBzdHJpbmcpOiBib29sZWFuID0+XG4gICAgIWV4Y2x1ZGVQYXR0ZXJucy5zb21lKChwOiBSZWdFeHApOiBib29sZWFuID0+ICEhcGF0aC5tYXRjaChwKSk7XG4gIGNvbnN0IHsgc2VnbWVudHMsIGlzQWJzb2x1dGU6IGlzR2xvYkFic29sdXRlLCBoYXNUcmFpbGluZ1NlcCwgd2luUm9vdCB9ID1cbiAgICBzcGxpdChnbG9iKTtcblxuICBsZXQgZml4ZWRSb290ID0gaXNHbG9iQWJzb2x1dGVcbiAgICA/ICh3aW5Sb290ICE9IHVuZGVmaW5lZCA/IHdpblJvb3QgOiBcIi9cIilcbiAgICA6IGFic1Jvb3Q7XG4gIHdoaWxlIChzZWdtZW50cy5sZW5ndGggPiAwICYmICFpc0dsb2Ioc2VnbWVudHNbMF0pKSB7XG4gICAgY29uc3Qgc2VnID0gc2VnbWVudHMuc2hpZnQoKTtcbiAgICBhc3NlcnQoc2VnICE9IG51bGwpO1xuICAgIGZpeGVkUm9vdCA9IGpvaW5HbG9icyhbZml4ZWRSb290LCBzZWddLCBnbG9iT3B0aW9ucyk7XG4gIH1cblxuICBsZXQgZml4ZWRSb290SW5mbzogV2Fsa0VudHJ5O1xuICB0cnkge1xuICAgIGZpeGVkUm9vdEluZm8gPSBhd2FpdCBfY3JlYXRlV2Fsa0VudHJ5KGZpeGVkUm9vdCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIHRocm93VW5sZXNzTm90Rm91bmQoZXJyb3IpO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24qIGFkdmFuY2VNYXRjaChcbiAgICB3YWxrSW5mbzogV2Fsa0VudHJ5LFxuICAgIGdsb2JTZWdtZW50OiBzdHJpbmcsXG4gICk6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxXYWxrRW50cnk+IHtcbiAgICBpZiAoIXdhbGtJbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChnbG9iU2VnbWVudCA9PSBcIi4uXCIpIHtcbiAgICAgIGNvbnN0IHBhcmVudFBhdGggPSBqb2luR2xvYnMoW3dhbGtJbmZvLnBhdGgsIFwiLi5cIl0sIGdsb2JPcHRpb25zKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzaG91bGRJbmNsdWRlKHBhcmVudFBhdGgpKSB7XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGF3YWl0IF9jcmVhdGVXYWxrRW50cnkocGFyZW50UGF0aCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRocm93VW5sZXNzTm90Rm91bmQoZXJyb3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoZ2xvYlNlZ21lbnQgPT0gXCIqKlwiKSB7XG4gICAgICByZXR1cm4geWllbGQqIHdhbGsod2Fsa0luZm8ucGF0aCwgeyBza2lwOiBleGNsdWRlUGF0dGVybnMgfSk7XG4gICAgfVxuICAgIGNvbnN0IGdsb2JQYXR0ZXJuID0gZ2xvYlRvUmVnRXhwKGdsb2JTZWdtZW50LCBnbG9iT3B0aW9ucyk7XG4gICAgZm9yIGF3YWl0IChcbiAgICAgIGNvbnN0IHdhbGtFbnRyeSBvZiB3YWxrKHdhbGtJbmZvLnBhdGgsIHtcbiAgICAgICAgbWF4RGVwdGg6IDEsXG4gICAgICAgIHNraXA6IGV4Y2x1ZGVQYXR0ZXJucyxcbiAgICAgIH0pXG4gICAgKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHdhbGtFbnRyeS5wYXRoICE9IHdhbGtJbmZvLnBhdGggJiYgd2Fsa0VudHJ5Lm5hbWUubWF0Y2goZ2xvYlBhdHRlcm4pXG4gICAgICApIHtcbiAgICAgICAgeWllbGQgd2Fsa0VudHJ5O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBjdXJyZW50TWF0Y2hlczogV2Fsa0VudHJ5W10gPSBbZml4ZWRSb290SW5mb107XG4gIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuICAgIC8vIEFkdmFuY2luZyB0aGUgbGlzdCBvZiBjdXJyZW50IG1hdGNoZXMgbWF5IGludHJvZHVjZSBkdXBsaWNhdGVzLCBzbyB3ZVxuICAgIC8vIHBhc3MgZXZlcnl0aGluZyB0aHJvdWdoIHRoaXMgTWFwLlxuICAgIGNvbnN0IG5leHRNYXRjaE1hcDogTWFwPHN0cmluZywgV2Fsa0VudHJ5PiA9IG5ldyBNYXAoKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChjdXJyZW50TWF0Y2hlcy5tYXAoYXN5bmMgKGN1cnJlbnRNYXRjaCkgPT4ge1xuICAgICAgZm9yIGF3YWl0IChjb25zdCBuZXh0TWF0Y2ggb2YgYWR2YW5jZU1hdGNoKGN1cnJlbnRNYXRjaCwgc2VnbWVudCkpIHtcbiAgICAgICAgbmV4dE1hdGNoTWFwLnNldChuZXh0TWF0Y2gucGF0aCwgbmV4dE1hdGNoKTtcbiAgICAgIH1cbiAgICB9KSk7XG4gICAgY3VycmVudE1hdGNoZXMgPSBbLi4ubmV4dE1hdGNoTWFwLnZhbHVlcygpXS5zb3J0KGNvbXBhcmVQYXRoKTtcbiAgfVxuICBpZiAoaGFzVHJhaWxpbmdTZXApIHtcbiAgICBjdXJyZW50TWF0Y2hlcyA9IGN1cnJlbnRNYXRjaGVzLmZpbHRlcihcbiAgICAgIChlbnRyeTogV2Fsa0VudHJ5KTogYm9vbGVhbiA9PiBlbnRyeS5pc0RpcmVjdG9yeSxcbiAgICApO1xuICB9XG4gIGlmICghaW5jbHVkZURpcnMpIHtcbiAgICBjdXJyZW50TWF0Y2hlcyA9IGN1cnJlbnRNYXRjaGVzLmZpbHRlcihcbiAgICAgIChlbnRyeTogV2Fsa0VudHJ5KTogYm9vbGVhbiA9PiAhZW50cnkuaXNEaXJlY3RvcnksXG4gICAgKTtcbiAgfVxuICB5aWVsZCogY3VycmVudE1hdGNoZXM7XG59XG5cbi8qKiBTeW5jaHJvbm91cyB2ZXJzaW9uIG9mIGBleHBhbmRHbG9iKClgLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqICAgICAgaW1wb3J0IHsgZXhwYW5kR2xvYlN5bmMgfSBmcm9tIFwiLi9leHBhbmRfZ2xvYi50c1wiO1xuICogICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZXhwYW5kR2xvYlN5bmMoXCIqKlxcLyoudHNcIikpIHtcbiAqICAgICAgICBjb25zb2xlLmxvZyhmaWxlKTtcbiAqICAgICAgfVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiogZXhwYW5kR2xvYlN5bmMoXG4gIGdsb2I6IHN0cmluZyxcbiAge1xuICAgIHJvb3QgPSBEZW5vLmN3ZCgpLFxuICAgIGV4Y2x1ZGUgPSBbXSxcbiAgICBpbmNsdWRlRGlycyA9IHRydWUsXG4gICAgZXh0ZW5kZWQgPSB0cnVlLFxuICAgIGdsb2JzdGFyID0gZmFsc2UsXG4gICAgY2FzZUluc2Vuc2l0aXZlLFxuICB9OiBFeHBhbmRHbG9iT3B0aW9ucyA9IHt9LFxuKTogSXRlcmFibGVJdGVyYXRvcjxXYWxrRW50cnk+IHtcbiAgY29uc3QgZ2xvYk9wdGlvbnM6IEdsb2JPcHRpb25zID0geyBleHRlbmRlZCwgZ2xvYnN0YXIsIGNhc2VJbnNlbnNpdGl2ZSB9O1xuICBjb25zdCBhYnNSb290ID0gcmVzb2x2ZShyb290KTtcbiAgY29uc3QgcmVzb2x2ZUZyb21Sb290ID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiByZXNvbHZlKGFic1Jvb3QsIHBhdGgpO1xuICBjb25zdCBleGNsdWRlUGF0dGVybnMgPSBleGNsdWRlXG4gICAgLm1hcChyZXNvbHZlRnJvbVJvb3QpXG4gICAgLm1hcCgoczogc3RyaW5nKTogUmVnRXhwID0+IGdsb2JUb1JlZ0V4cChzLCBnbG9iT3B0aW9ucykpO1xuICBjb25zdCBzaG91bGRJbmNsdWRlID0gKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4gPT5cbiAgICAhZXhjbHVkZVBhdHRlcm5zLnNvbWUoKHA6IFJlZ0V4cCk6IGJvb2xlYW4gPT4gISFwYXRoLm1hdGNoKHApKTtcbiAgY29uc3QgeyBzZWdtZW50cywgaXNBYnNvbHV0ZTogaXNHbG9iQWJzb2x1dGUsIGhhc1RyYWlsaW5nU2VwLCB3aW5Sb290IH0gPVxuICAgIHNwbGl0KGdsb2IpO1xuXG4gIGxldCBmaXhlZFJvb3QgPSBpc0dsb2JBYnNvbHV0ZVxuICAgID8gKHdpblJvb3QgIT0gdW5kZWZpbmVkID8gd2luUm9vdCA6IFwiL1wiKVxuICAgIDogYWJzUm9vdDtcbiAgd2hpbGUgKHNlZ21lbnRzLmxlbmd0aCA+IDAgJiYgIWlzR2xvYihzZWdtZW50c1swXSkpIHtcbiAgICBjb25zdCBzZWcgPSBzZWdtZW50cy5zaGlmdCgpO1xuICAgIGFzc2VydChzZWcgIT0gbnVsbCk7XG4gICAgZml4ZWRSb290ID0gam9pbkdsb2JzKFtmaXhlZFJvb3QsIHNlZ10sIGdsb2JPcHRpb25zKTtcbiAgfVxuXG4gIGxldCBmaXhlZFJvb3RJbmZvOiBXYWxrRW50cnk7XG4gIHRyeSB7XG4gICAgZml4ZWRSb290SW5mbyA9IF9jcmVhdGVXYWxrRW50cnlTeW5jKGZpeGVkUm9vdCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIHRocm93VW5sZXNzTm90Rm91bmQoZXJyb3IpO1xuICB9XG5cbiAgZnVuY3Rpb24qIGFkdmFuY2VNYXRjaChcbiAgICB3YWxrSW5mbzogV2Fsa0VudHJ5LFxuICAgIGdsb2JTZWdtZW50OiBzdHJpbmcsXG4gICk6IEl0ZXJhYmxlSXRlcmF0b3I8V2Fsa0VudHJ5PiB7XG4gICAgaWYgKCF3YWxrSW5mby5pc0RpcmVjdG9yeSkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoZ2xvYlNlZ21lbnQgPT0gXCIuLlwiKSB7XG4gICAgICBjb25zdCBwYXJlbnRQYXRoID0gam9pbkdsb2JzKFt3YWxrSW5mby5wYXRoLCBcIi4uXCJdLCBnbG9iT3B0aW9ucyk7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2hvdWxkSW5jbHVkZShwYXJlbnRQYXRoKSkge1xuICAgICAgICAgIHJldHVybiB5aWVsZCBfY3JlYXRlV2Fsa0VudHJ5U3luYyhwYXJlbnRQYXRoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhyb3dVbmxlc3NOb3RGb3VuZChlcnJvcik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChnbG9iU2VnbWVudCA9PSBcIioqXCIpIHtcbiAgICAgIHJldHVybiB5aWVsZCogd2Fsa1N5bmMod2Fsa0luZm8ucGF0aCwgeyBza2lwOiBleGNsdWRlUGF0dGVybnMgfSk7XG4gICAgfVxuICAgIGNvbnN0IGdsb2JQYXR0ZXJuID0gZ2xvYlRvUmVnRXhwKGdsb2JTZWdtZW50LCBnbG9iT3B0aW9ucyk7XG4gICAgZm9yIChcbiAgICAgIGNvbnN0IHdhbGtFbnRyeSBvZiB3YWxrU3luYyh3YWxrSW5mby5wYXRoLCB7XG4gICAgICAgIG1heERlcHRoOiAxLFxuICAgICAgICBza2lwOiBleGNsdWRlUGF0dGVybnMsXG4gICAgICB9KVxuICAgICkge1xuICAgICAgaWYgKFxuICAgICAgICB3YWxrRW50cnkucGF0aCAhPSB3YWxrSW5mby5wYXRoICYmIHdhbGtFbnRyeS5uYW1lLm1hdGNoKGdsb2JQYXR0ZXJuKVxuICAgICAgKSB7XG4gICAgICAgIHlpZWxkIHdhbGtFbnRyeTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgY3VycmVudE1hdGNoZXM6IFdhbGtFbnRyeVtdID0gW2ZpeGVkUm9vdEluZm9dO1xuICBmb3IgKGNvbnN0IHNlZ21lbnQgb2Ygc2VnbWVudHMpIHtcbiAgICAvLyBBZHZhbmNpbmcgdGhlIGxpc3Qgb2YgY3VycmVudCBtYXRjaGVzIG1heSBpbnRyb2R1Y2UgZHVwbGljYXRlcywgc28gd2VcbiAgICAvLyBwYXNzIGV2ZXJ5dGhpbmcgdGhyb3VnaCB0aGlzIE1hcC5cbiAgICBjb25zdCBuZXh0TWF0Y2hNYXA6IE1hcDxzdHJpbmcsIFdhbGtFbnRyeT4gPSBuZXcgTWFwKCk7XG4gICAgZm9yIChjb25zdCBjdXJyZW50TWF0Y2ggb2YgY3VycmVudE1hdGNoZXMpIHtcbiAgICAgIGZvciAoY29uc3QgbmV4dE1hdGNoIG9mIGFkdmFuY2VNYXRjaChjdXJyZW50TWF0Y2gsIHNlZ21lbnQpKSB7XG4gICAgICAgIG5leHRNYXRjaE1hcC5zZXQobmV4dE1hdGNoLnBhdGgsIG5leHRNYXRjaCk7XG4gICAgICB9XG4gICAgfVxuICAgIGN1cnJlbnRNYXRjaGVzID0gWy4uLm5leHRNYXRjaE1hcC52YWx1ZXMoKV0uc29ydChjb21wYXJlUGF0aCk7XG4gIH1cbiAgaWYgKGhhc1RyYWlsaW5nU2VwKSB7XG4gICAgY3VycmVudE1hdGNoZXMgPSBjdXJyZW50TWF0Y2hlcy5maWx0ZXIoXG4gICAgICAoZW50cnk6IFdhbGtFbnRyeSk6IGJvb2xlYW4gPT4gZW50cnkuaXNEaXJlY3RvcnksXG4gICAgKTtcbiAgfVxuICBpZiAoIWluY2x1ZGVEaXJzKSB7XG4gICAgY3VycmVudE1hdGNoZXMgPSBjdXJyZW50TWF0Y2hlcy5maWx0ZXIoXG4gICAgICAoZW50cnk6IFdhbGtFbnRyeSk6IGJvb2xlYW4gPT4gIWVudHJ5LmlzRGlyZWN0b3J5LFxuICAgICk7XG4gIH1cbiAgeWllbGQqIGN1cnJlbnRNYXRjaGVzO1xufVxuIl19