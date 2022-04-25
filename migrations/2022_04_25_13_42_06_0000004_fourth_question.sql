INSERT INTO questions(question, function_signature, default_custom_input, input_output_format, test_cases)
VALUES ('You are given a positive integer $x$ with at most 32 bits if represented in binary form. Return the number of positive bits it contains.;'
    'For example, the integer 7 has three positive bits.', 'def numberOfPositiveBits(x):', '7', '1;n|1;n',
    '7|'
    '4294967295|'
    '0|'
    '4294967294|'
    '78965424|'
    '148822366|'
    '87451|'
    '7465|'
    '7887892|'
    '35642|'
    '826498|'
    '3|32|0|31|13|17|10|7|10|8|8');