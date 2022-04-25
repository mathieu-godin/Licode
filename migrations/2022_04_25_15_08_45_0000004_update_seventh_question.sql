UPDATE questions SET question = 'You are given a positive integer $integer$.;'
    'After representing $integer$ in binary form, return 1 if all its binary digits are different than the ones that are adjacent.;'
    'For example, 10 is 1010 in binary form and all its digits are different from their neighbours. As such, 1 would have to be returned in that case',
    default_custom_input = '10',
    function_signature = 'def eachBinaryDigitDifferentFromItsNeighbours(integer):'
    WHERE id = 7;