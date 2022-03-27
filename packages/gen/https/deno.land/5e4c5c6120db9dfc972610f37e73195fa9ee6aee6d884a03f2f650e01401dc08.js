const DEFAULT_RESOLVE = () => true;
const DEFAULT_CONSTRUCT = (data) => data;
function checkTagFormat(tag) {
    return tag;
}
export class Type {
    tag;
    kind = null;
    instanceOf;
    predicate;
    represent;
    defaultStyle;
    styleAliases;
    loadKind;
    constructor(tag, options) {
        this.tag = checkTagFormat(tag);
        if (options) {
            this.kind = options.kind;
            this.resolve = options.resolve || DEFAULT_RESOLVE;
            this.construct = options.construct || DEFAULT_CONSTRUCT;
            this.instanceOf = options.instanceOf;
            this.predicate = options.predicate;
            this.represent = options.represent;
            this.defaultStyle = options.defaultStyle;
            this.styleAliases = options.styleAliases;
        }
    }
    resolve = () => true;
    construct = (data) => data;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEyNS4wL2VuY29kaW5nL195YW1sL3R5cGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBV0EsTUFBTSxlQUFlLEdBQUcsR0FBWSxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQzVDLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxJQUFTLEVBQU8sRUFBRSxDQUFDLElBQUksQ0FBQztBQWFuRCxTQUFTLGNBQWMsQ0FBQyxHQUFXO0lBQ2pDLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELE1BQU0sT0FBTyxJQUFJO0lBQ1IsR0FBRyxDQUFTO0lBQ1osSUFBSSxHQUFvQixJQUFJLENBQUM7SUFDN0IsVUFBVSxDQUFNO0lBQ2hCLFNBQVMsQ0FBOEM7SUFDdkQsU0FBUyxDQUEwQztJQUNuRCxZQUFZLENBQWdCO0lBQzVCLFlBQVksQ0FBZTtJQUMzQixRQUFRLENBQVk7SUFFM0IsWUFBWSxHQUFXLEVBQUUsT0FBcUI7UUFDNUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsSUFBSSxPQUFPLEVBQUU7WUFDWCxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLGVBQWUsQ0FBQztZQUNsRCxJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksaUJBQWlCLENBQUM7WUFDeEQsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztZQUNuQyxJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDbkMsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQztTQUMxQztJQUNILENBQUM7SUFDTSxPQUFPLEdBQTRCLEdBQVksRUFBRSxDQUFDLElBQUksQ0FBQztJQUN2RCxTQUFTLEdBQXdCLENBQUMsSUFBSSxFQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7Q0FDN0QiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3J0ZWQgZnJvbSBqcy15YW1sIHYzLjEzLjE6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL2pzLXlhbWwvY29tbWl0LzY2NWFhZGRhNDIzNDlkY2FlODY5ZjEyMDQwZDliMTBlZjE4ZDEyZGFcbi8vIENvcHlyaWdodCAyMDExLTIwMTUgYnkgVml0YWx5IFB1enJpbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgdHlwZSB7IEFueSwgQXJyYXlPYmplY3QgfSBmcm9tIFwiLi91dGlscy50c1wiO1xuXG5leHBvcnQgdHlwZSBLaW5kVHlwZSA9IFwic2VxdWVuY2VcIiB8IFwic2NhbGFyXCIgfCBcIm1hcHBpbmdcIjtcbmV4cG9ydCB0eXBlIFN0eWxlVmFyaWFudCA9IFwibG93ZXJjYXNlXCIgfCBcInVwcGVyY2FzZVwiIHwgXCJjYW1lbGNhc2VcIiB8IFwiZGVjaW1hbFwiO1xuZXhwb3J0IHR5cGUgUmVwcmVzZW50Rm4gPSAoZGF0YTogQW55LCBzdHlsZT86IFN0eWxlVmFyaWFudCkgPT4gQW55O1xuXG5jb25zdCBERUZBVUxUX1JFU09MVkUgPSAoKTogYm9vbGVhbiA9PiB0cnVlO1xuY29uc3QgREVGQVVMVF9DT05TVFJVQ1QgPSAoZGF0YTogQW55KTogQW55ID0+IGRhdGE7XG5cbmludGVyZmFjZSBUeXBlT3B0aW9ucyB7XG4gIGtpbmQ6IEtpbmRUeXBlO1xuICByZXNvbHZlPzogKGRhdGE6IEFueSkgPT4gYm9vbGVhbjtcbiAgY29uc3RydWN0PzogKGRhdGE6IHN0cmluZykgPT4gQW55O1xuICBpbnN0YW5jZU9mPzogQW55O1xuICBwcmVkaWNhdGU/OiAoZGF0YTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IGJvb2xlYW47XG4gIHJlcHJlc2VudD86IFJlcHJlc2VudEZuIHwgQXJyYXlPYmplY3Q8UmVwcmVzZW50Rm4+O1xuICBkZWZhdWx0U3R5bGU/OiBTdHlsZVZhcmlhbnQ7XG4gIHN0eWxlQWxpYXNlcz86IEFycmF5T2JqZWN0O1xufVxuXG5mdW5jdGlvbiBjaGVja1RhZ0Zvcm1hdCh0YWc6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0YWc7XG59XG5cbmV4cG9ydCBjbGFzcyBUeXBlIHtcbiAgcHVibGljIHRhZzogc3RyaW5nO1xuICBwdWJsaWMga2luZDogS2luZFR5cGUgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGluc3RhbmNlT2Y6IEFueTtcbiAgcHVibGljIHByZWRpY2F0ZT86IChkYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gYm9vbGVhbjtcbiAgcHVibGljIHJlcHJlc2VudD86IFJlcHJlc2VudEZuIHwgQXJyYXlPYmplY3Q8UmVwcmVzZW50Rm4+O1xuICBwdWJsaWMgZGVmYXVsdFN0eWxlPzogU3R5bGVWYXJpYW50O1xuICBwdWJsaWMgc3R5bGVBbGlhc2VzPzogQXJyYXlPYmplY3Q7XG4gIHB1YmxpYyBsb2FkS2luZD86IEtpbmRUeXBlO1xuXG4gIGNvbnN0cnVjdG9yKHRhZzogc3RyaW5nLCBvcHRpb25zPzogVHlwZU9wdGlvbnMpIHtcbiAgICB0aGlzLnRhZyA9IGNoZWNrVGFnRm9ybWF0KHRhZyk7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMua2luZCA9IG9wdGlvbnMua2luZDtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IG9wdGlvbnMucmVzb2x2ZSB8fCBERUZBVUxUX1JFU09MVkU7XG4gICAgICB0aGlzLmNvbnN0cnVjdCA9IG9wdGlvbnMuY29uc3RydWN0IHx8IERFRkFVTFRfQ09OU1RSVUNUO1xuICAgICAgdGhpcy5pbnN0YW5jZU9mID0gb3B0aW9ucy5pbnN0YW5jZU9mO1xuICAgICAgdGhpcy5wcmVkaWNhdGUgPSBvcHRpb25zLnByZWRpY2F0ZTtcbiAgICAgIHRoaXMucmVwcmVzZW50ID0gb3B0aW9ucy5yZXByZXNlbnQ7XG4gICAgICB0aGlzLmRlZmF1bHRTdHlsZSA9IG9wdGlvbnMuZGVmYXVsdFN0eWxlO1xuICAgICAgdGhpcy5zdHlsZUFsaWFzZXMgPSBvcHRpb25zLnN0eWxlQWxpYXNlcztcbiAgICB9XG4gIH1cbiAgcHVibGljIHJlc29sdmU6IChkYXRhPzogQW55KSA9PiBib29sZWFuID0gKCk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgcHVibGljIGNvbnN0cnVjdDogKGRhdGE/OiBBbnkpID0+IEFueSA9IChkYXRhKTogQW55ID0+IGRhdGE7XG59XG4iXX0=