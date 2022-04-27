def palindrome(integer):
    digits = []
    highestPower = 0
    i = 1
    integerModuloPrevious = 0
    while (True):
        powerOf10 = pow(10, i)
        integerDivided = integer // powerOf10
        integerModulo = integer % powerOf10
        digits.append((integerModulo - integerModuloPrevious)
            // (powerOf10 // 10))
        integerModuloPrevious = integerModulo
        if integerDivided == 0:
            break
        i += 1
    i = 0
    iMax = len(digits) / 2
    while i < iMax:
        if digits[i] != digits[-i - 1]:
            return 0
        i += 1
    return 1