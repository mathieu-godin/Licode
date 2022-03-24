/*!
 * Adapted directly from media-typer at https://github.com/jshttp/media-typer/
 * which is licensed as follows:
 *
 * media-typer
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */
const SUBTYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.-]{0,126}$/;
const TYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}$/;
const TYPE_REGEXP = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/;
class MediaType {
    type;
    subtype;
    suffix;
    constructor(type, subtype, suffix) {
        this.type = type;
        this.subtype = subtype;
        this.suffix = suffix;
    }
}
export function format(obj) {
    const { subtype, suffix, type } = obj;
    if (!TYPE_NAME_REGEXP.test(type)) {
        throw new TypeError("Invalid type.");
    }
    if (!SUBTYPE_NAME_REGEXP.test(subtype)) {
        throw new TypeError("Invalid subtype.");
    }
    let str = `${type}/${subtype}`;
    if (suffix) {
        if (!TYPE_NAME_REGEXP.test(suffix)) {
            throw new TypeError("Invalid suffix.");
        }
        str += `+${suffix}`;
    }
    return str;
}
export function parse(str) {
    const match = TYPE_REGEXP.exec(str.toLowerCase());
    if (!match) {
        throw new TypeError("Invalid media type.");
    }
    let [, type, subtype] = match;
    let suffix;
    const idx = subtype.lastIndexOf("+");
    if (idx !== -1) {
        suffix = subtype.substr(idx + 1);
        subtype = subtype.substr(0, idx);
    }
    return new MediaType(type, subtype, suffix);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWFUeXBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lZGlhVHlwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7R0FPRztBQUVILE1BQU0sbUJBQW1CLEdBQUcseUNBQXlDLENBQUM7QUFDdEUsTUFBTSxnQkFBZ0IsR0FBRyx3Q0FBd0MsQ0FBQztBQUNsRSxNQUFNLFdBQVcsR0FDZix3RkFBd0YsQ0FBQztBQUUzRixNQUFNLFNBQVM7SUFHSjtJQUVBO0lBRUE7SUFOVCxZQUVTLElBQVksRUFFWixPQUFlLEVBRWYsTUFBZTtRQUpmLFNBQUksR0FBSixJQUFJLENBQVE7UUFFWixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBRWYsV0FBTSxHQUFOLE1BQU0sQ0FBUztJQUNyQixDQUFDO0NBQ0w7QUFTRCxNQUFNLFVBQVUsTUFBTSxDQUFDLEdBQWM7SUFDbkMsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO0lBRXRDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDaEMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztLQUN0QztJQUNELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDdEMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0tBQ3pDO0lBRUQsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksT0FBTyxFQUFFLENBQUM7SUFFL0IsSUFBSSxNQUFNLEVBQUU7UUFDVixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2xDLE1BQU0sSUFBSSxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztTQUN4QztRQUVELEdBQUcsSUFBSSxJQUFJLE1BQU0sRUFBRSxDQUFDO0tBQ3JCO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBV0QsTUFBTSxVQUFVLEtBQUssQ0FBQyxHQUFXO0lBQy9CLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFFbEQsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNWLE1BQU0sSUFBSSxTQUFTLENBQUMscUJBQXFCLENBQUMsQ0FBQztLQUM1QztJQUVELElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxLQUFLLENBQUM7SUFDOUIsSUFBSSxNQUEwQixDQUFDO0lBRS9CLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDZCxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ2xDO0lBRUQsT0FBTyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEFkYXB0ZWQgZGlyZWN0bHkgZnJvbSBtZWRpYS10eXBlciBhdCBodHRwczovL2dpdGh1Yi5jb20vanNodHRwL21lZGlhLXR5cGVyL1xuICogd2hpY2ggaXMgbGljZW5zZWQgYXMgZm9sbG93czpcbiAqXG4gKiBtZWRpYS10eXBlclxuICogQ29weXJpZ2h0KGMpIDIwMTQtMjAxNyBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuY29uc3QgU1VCVFlQRV9OQU1FX1JFR0VYUCA9IC9eW0EtWmEtejAtOV1bQS1aYS16MC05ISMkJl5fLi1dezAsMTI2fSQvO1xuY29uc3QgVFlQRV9OQU1FX1JFR0VYUCA9IC9eW0EtWmEtejAtOV1bQS1aYS16MC05ISMkJl5fLV17MCwxMjZ9JC87XG5jb25zdCBUWVBFX1JFR0VYUCA9XG4gIC9eICooW0EtWmEtejAtOV1bQS1aYS16MC05ISMkJl5fLV17MCwxMjZ9KVxcLyhbQS1aYS16MC05XVtBLVphLXowLTkhIyQmXl8uKy1dezAsMTI2fSkgKiQvO1xuXG5jbGFzcyBNZWRpYVR5cGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAvKiogVGhlIHR5cGUgb2YgdGhlIG1lZGlhIHR5cGUuICovXG4gICAgcHVibGljIHR5cGU6IHN0cmluZyxcbiAgICAvKiogVGhlIHN1YnR5cGUgb2YgdGhlIG1lZGlhIHR5cGUuICovXG4gICAgcHVibGljIHN1YnR5cGU6IHN0cmluZyxcbiAgICAvKiogVGhlIG9wdGlvbmFsIHN1ZmZpeCBvZiB0aGUgbWVkaWEgdHlwZS4gKi9cbiAgICBwdWJsaWMgc3VmZml4Pzogc3RyaW5nLFxuICApIHt9XG59XG5cbi8qKiBHaXZlbiBhIG1lZGlhIHR5cGUgb2JqZWN0LCByZXR1cm4gYSBtZWRpYSB0eXBlIHN0cmluZy5cbiAqXG4gKiAgICAgICBmb3JtYXQoe1xuICogICAgICAgICB0eXBlOiBcInRleHRcIixcbiAqICAgICAgICAgc3VidHlwZTogXCJodG1sXCJcbiAqICAgICAgIH0pOyAvLyByZXR1cm5zIFwidGV4dC9odG1sXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdChvYmo6IE1lZGlhVHlwZSk6IHN0cmluZyB7XG4gIGNvbnN0IHsgc3VidHlwZSwgc3VmZml4LCB0eXBlIH0gPSBvYmo7XG5cbiAgaWYgKCFUWVBFX05BTUVfUkVHRVhQLnRlc3QodHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCB0eXBlLlwiKTtcbiAgfVxuICBpZiAoIVNVQlRZUEVfTkFNRV9SRUdFWFAudGVzdChzdWJ0eXBlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIHN1YnR5cGUuXCIpO1xuICB9XG5cbiAgbGV0IHN0ciA9IGAke3R5cGV9LyR7c3VidHlwZX1gO1xuXG4gIGlmIChzdWZmaXgpIHtcbiAgICBpZiAoIVRZUEVfTkFNRV9SRUdFWFAudGVzdChzdWZmaXgpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBzdWZmaXguXCIpO1xuICAgIH1cblxuICAgIHN0ciArPSBgKyR7c3VmZml4fWA7XG4gIH1cblxuICByZXR1cm4gc3RyO1xufVxuXG4vKiogR2l2ZW4gYSBtZWRpYSB0eXBlIHN0cmluZywgcmV0dXJuIGEgbWVkaWEgdHlwZSBvYmplY3QuXG4gKlxuICogICAgICAgcGFyc2UoXCJhcHBsaWNhdGlvbi9qc29uLXBhdGNoK2pzb25cIik7XG4gKiAgICAgICAvLyByZXR1cm5zIHtcbiAqICAgICAgIC8vICAgdHlwZTogXCJhcHBsaWNhdGlvblwiLFxuICogICAgICAgLy8gICBzdWJ0eXBlOiBcImpzb24tcGF0Y2hcIixcbiAqICAgICAgIC8vICAgc3VmZml4OiBcImpzb25cIlxuICogICAgICAgLy8gfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2Uoc3RyOiBzdHJpbmcpOiBNZWRpYVR5cGUge1xuICBjb25zdCBtYXRjaCA9IFRZUEVfUkVHRVhQLmV4ZWMoc3RyLnRvTG93ZXJDYXNlKCkpO1xuXG4gIGlmICghbWF0Y2gpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBtZWRpYSB0eXBlLlwiKTtcbiAgfVxuXG4gIGxldCBbLCB0eXBlLCBzdWJ0eXBlXSA9IG1hdGNoO1xuICBsZXQgc3VmZml4OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3QgaWR4ID0gc3VidHlwZS5sYXN0SW5kZXhPZihcIitcIik7XG4gIGlmIChpZHggIT09IC0xKSB7XG4gICAgc3VmZml4ID0gc3VidHlwZS5zdWJzdHIoaWR4ICsgMSk7XG4gICAgc3VidHlwZSA9IHN1YnR5cGUuc3Vic3RyKDAsIGlkeCk7XG4gIH1cblxuICByZXR1cm4gbmV3IE1lZGlhVHlwZSh0eXBlLCBzdWJ0eXBlLCBzdWZmaXgpO1xufVxuIl19