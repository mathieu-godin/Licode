def numberOfPositiveBits(integer):
    numPositiveBits = 0
    highestPower = 0
    i = 1
    integerModuloPrevious = 0
    while (True):
        powerOf2 = pow(2, i)
        integerDivided = integer // powerOf2
        integerModulo = integer % powerOf2
        numPositiveBits += (integerModulo - integerModuloPrevious) // (powerOf2 // 2)
        integerModuloPrevious = integerModulo
        if integerDivided == 0:
            break
        i += 1
    return numPositiveBits