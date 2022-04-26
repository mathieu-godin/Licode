INSERT INTO questions(question, function_signature, default_custom_input, input_output_format, test_cases)
VALUES ('You are given an integer $integer$. If its prime factors are limited to 3 and 7, return 1. Otherwise, return 0.;'
    'For example, the prime factors of 63 are 3, 3, and 7 which are limited to 3 and 7. As such, 1 should be returned in this case.',
    'def primeFactorsLimitedTo3And7(integer):', '', '1;n|1;a',
    '6|'
    '5|'
    '3|'
    '2|'
    '100|'
    '101|'
    '120|'
    '102|'
    '49|'
    '63|'
    '1029|'
    '0|0|1|0|0|0|0|0|1|1|1');