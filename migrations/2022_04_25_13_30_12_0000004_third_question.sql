INSERT INTO questions(question, function_signature, default_custom_input, input_output_format, test_cases)
VALUES ('You are given an integer $x$. Return 1 if it is a palindrome and 0 otherwise.;'
    'A palindrome is a number that can be read forwards or backwards and still be read as the same number.;'
    'For instance, 12321 is a palindrome while 123 is not.', 'def isPalindrome(x):', '121', '1;n|1;n',
    '121|'
    '9462649|'
    '654456|'
    '741258852147|'
    '9876543219457156689742|'
    '11111111111111|'
    '123123123789789789|'
    '123654789987456321|'
    '71111117|'
    '78979879789877546456123135844684123745987416984154512|'
    '654654654654654456456456456456|'
    '1|1|1|1|0|1|0|1|1|0|1');