INSERT INTO questions(question, function_signature, default_custom_input, input_output_format, test_cases)
VALUES ('You are given an array of integers $integers$. Each integer in $integers$ is a duplicate except for one.;'
    'Return the value of the only integer in $integers$ that is not duplicated.;'
    '$integers$ is never empty.',
    'def findNotDuplicatedInteger(integers):', '[2,1,1,2,4]', '1;a|1;n',
    '5;2;1;1;2;4|'
    '9;7;9;8;3;7;9;8;3;2|'
    '7;789;789;654;654;159;852;159|'
    '1;5|'
    '7;8;7;6;6;7;8;9|'
    '3;9;11111111111111;11111111111111|'
    '3;123;123;19|'
    '7;987654;987654;14;12;13;14;13|'
    '3;987;456;987|'
    '17;7;8;9;4;5;6;1;2;3;1;2;4;5;6;7;8;9|'
    '3;5;8;5|'
    '4|2|852|5|9|9|19|12|456|3|8');