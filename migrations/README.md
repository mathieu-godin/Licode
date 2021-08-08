# migrations

## Description

A simple Postgres utility inspired by Laravel Migrations. Uses Python 3 and **psycopg2**.

## Prerequisite

Install the **psycopg2** package (below commands are for Ubuntu):

```bash
sudo apt install libpq-dev python3-dev
pip install psycopg2
```

## Usage

Create a database migration:

```bash
python migrations/migrations.py make <migration-name>
```

Perform all migrations that haven't been performed:
```bash
python migrations/migrations.py migrate
```
