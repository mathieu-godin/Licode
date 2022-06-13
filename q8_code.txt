def primeFactorsLimitedTo3And7(integer):
    if integer < 1:
        return 0
    while integer > 1:
        if integer % 3 == 0:
            integer /= 3
        elif integer % 7 == 0:
            integer /= 7
        else:
            return 0
    return 1