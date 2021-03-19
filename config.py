from os import environ, path
from dotenv import load_dotenv

# get the dir name of this file
basedir = path.abspath(path.dirname(__file__))
# join the dir name and the .env file into dotenv
load_dotenv(path.join(basedir, '.env'))

# class holding the OS values for keys
class Config:
    # secure keys
    SECRET_KEY=environ.get('SECRECT_KEY')
    API_KEY=environ.get('API_KEY')