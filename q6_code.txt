def longestSequenceOfConsecutive1s(integers):
    maxLength = 0
    candidateLength = 0
    for integer in integers:
        if integer == 1:
            candidateLength += 1
        else:
            if candidateLength > maxLength:
                maxLength = candidateLength
            candidateLength = 0
    if candidateLength > maxLength:
        maxLength = candidateLength
    return maxLength