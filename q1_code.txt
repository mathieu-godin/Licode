def pairSumIndices(integers, pairSum):
    i = 0
    while i < len(integers):
        j = 0
        while j < len(integers):
            if i != j and integers[i] + integers[j] == pairSum:
                return [i, j]
            j += 1
        i += 1