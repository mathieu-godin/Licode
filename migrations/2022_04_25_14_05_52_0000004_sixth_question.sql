INSERT INTO questions(question, function_signature, default_custom_input, input_output_format, test_cases)
VALUES ('You are given an array of integers $integers$ only containing 0s and 1s. Return the length of the longest sequence of consecutive 1s in $integers$;',
    'def longestSequenceOfConsecutive1s(integers):', '[1,1,1,0]', '1;a|1;n',
    '1;1;1;1;1;1|'
    '0;0;0;0;0;0;0;0;0;0|'
    '1;0;1;0;1;0;1|'
    '1|'
    '0|'
    '0;0;0;0;0;0;1;0;0;0;0;0|'
    '1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;0|'
    '0;1;0;1;0|'
    '0;0;0;0;0;0;1;0;0;0;0;0;0;0;1;0;0;0;0;0;0;0;0;1|'
    '1;1;1;0;0;0;0;0;1;1;0;0;0;1;1;1;1|'
    '0;0;1;1;1;0;0;0;1;0;1;1;1;0;0;0;|'
    '6|0|1|1|0|1|38|1|1|4|3');