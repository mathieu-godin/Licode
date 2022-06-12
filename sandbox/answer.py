def arrangementSumPossibleIntegers(integers, arrangementSum):
    subArrs = []
    d = dict()
    for i in range(1, len(integers)):
        newDict = dict()
        for n in integers:
            for pSum, nums in d.items():
                if (pSum + n) == arrangementSum:
                    for arr in nums:
                        arr.append(n)
                        subArrs.append(arr)
                else if (pSum + n) < arrangementSum:
                    for arr in nums:
                        arr.append(n)
                        if (pSum + n) in d:
                            newDict[pSum + n].append(arr)
                        else
                            newDict[pSum + n] = [arr]
        d = newDict
    return subArrs
        
    

import sys

if __name__ == "__main__":
    n0 = int(input())
    print("G", end="", file=sys.stderr)
    print(n0, end="", file=sys.stderr)
    print("H", end="", file=sys.stderr)
    p0 = []
    for i in range(n0):
        gh = int(input())
        print("G", end="", file=sys.stderr)
        print(gh, end="", file=sys.stderr)
        print("H", end="", file=sys.stderr)
        p0.append(gh)
    p1 = int(input())
    print("G", end="", file=sys.stderr)
    print(p1, end="", file=sys.stderr)
    print("H", end="", file=sys.stderr)
    result = arrangementSumPossibleIntegers(p0, p1)
    print("v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB")
    print(len(result))
    for r in result:
        print(len(r))
        for rr in r:
            print(rr)
