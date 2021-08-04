import sys
import os
from datetime import datetime
import psycopg2

try:
    LAST_PERFORMED_FILE = '.last_performed'
    CONFIG_FILE = 'migrations.conf'
    if len(sys.argv) == 3 and sys.argv[1] == 'make':
        date_time = datetime.now()
        file_name = str(date_time.year) + '_' + str(date_time.month) + '_' \
            + str(date_time.day) + '_' + str(date_time.hour) + '_' \
            + str(date_time.minute) + '_' + str(date_time.second) + '_' \
            + str(date_time.microsecond) + '_' + sys.argv[2] + '.sql'
        f = open(file_name, 'w')
        f.close()
        print("Migration " + file_name + " was created")
    elif len(sys.argv) == 2 and sys.argv[1] == 'migrate':
        files = os.listdir()
        files.sort()
        if len(files) > 0:
            i = 0
            while files[i][0] == '.':
                i += 1
            if LAST_PERFORMED_FILE in files:
                f = open(LAST_PERFORMED_FILE, 'r')
                last_performed = f.read()
                f.close()
                while files[i] != last_performed:
                    i += 1
                i += 1
            f = open(CONFIG_FILE, 'r')
            config_lines = f.read().split('\n')
            f.close()
            config_dic = {}
            for config_line in config_lines:
                config_line = config_line.split('#')[0]
                config_line_split = config_line.split()
                if len(config_line_split) > 1:
                    config_dic[config_line_split[0]] = config_line_split[1]
            ps_connection = False
            try:
                ps_connection = psycopg2.connect(user=config_dic['user'],
                                                password=config_dic['password'],
                                                host=config_dic['host'],
                                                port=config_dic['port'],
                                                database=config_dic['database'])
                cursor = ps_connection.cursor()
                some_migrations = False
                if files[i].endswith('.sql'):
                    some_migrations = True
                    print()
                while files[i].endswith('.sql'):
                    print("Executing migration " + files[i])
                    f = open(files[i], 'r')
                    sql_script_content = f.read()
                    f.close()
                    with ps_connection:
                        with ps_connection.cursor() as curs:
                            curs.execute(sql_script_content)
                    print("Executed migration " + files[i] + " successfully")
                    f = open(LAST_PERFORMED_FILE, 'w')
                    f.write(files[i])
                    f.close()
                    i += 1
                if some_migrations:
                    print()
                if ps_connection:
                    cursor.close()
                    ps_connection.close()
            except (Exception, psycopg2.DatabaseError) as e:
                print("\nAn error occurred while connecting to PostgreSQL:\n")
                print(e)
                if ps_connection:
                    cursor.close()
                    ps_connection.close()
                sys.exit()
    else:
        print("\nUsage:\n\nmigrations.py make <migration-name>\n\nmigrations.py "
            + "migrate\n")
except Exception as e:
    print("\nAn error has occurred:\n")
    print(e)