def eachBinaryDigitDifferentFromItsNeighbours(integer):
    digits = []
    highestPower = 0
    i = 1
    integerModuloPrevious = 0
    while (True):
        powerOf2 = pow(2, i)
        integerDivided = integer // powerOf2
        integerModulo = integer % powerOf2
        digits.append((integerModulo - integerModuloPrevious)
            // (powerOf2 // 2) == 1)
        integerModuloPrevious = integerModulo
        if integerDivided == 0:
            break
        i += 1
    if len(digits) < 2:
        return 1
    previous = digits[0]
    i = 1
    while i < len(digits):
        if digits[i] == previous:
            return 0
        previous = digits[i]
        i += 1
    return 1