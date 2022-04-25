INSERT INTO questions(question, function_signature, default_custom_input, input_output_format, test_cases)
VALUES ('You are given a positive integer $integer$.;'
    'After representing $integer$ in binary form, return 1 if all its binary digits are different than the ones that are adjacent.;'
    'For example, 21 is 10101 in binary form and all its digits are different from their neighbours. As such, 1 would have to be returned in that case',
    'def eachBinaryDigitDifferentFromItsNeighbours(x):', '21', '1;n|1;n',
    '5|'
    '11184810|'
    '597|'
    '121|'
    '21|'
    '1365|'
    '1|'
    '0|'
    '985|'
    '852369|'
    '9713|'
    '1|1|0|0|1|1|1|1|0|0|0');