# Secret Santa

This app choose secret santa for each people and send them mail to keep it secret.

Everyone is placed in a single gift loop (A → B → C → … → A), so nobody draws themselves and there are no closed pairs.

## Install

```sh
yarn install
```

## Web interface

```sh
yarn gui
```

Then open http://localhost:3000. From there you can:

- add, edit, remove participants or import a `santas.csv` file, and save them back to disk
- pick who someone can't draw (with an option to make exclusions mutual, e.g. for couples)
- see live whether a valid draw is possible with the current exclusions
- edit the mail subject and content with a live preview
- test the SMTP connection
- do a dry run (results are blurred so the organizer can play too) or draw and send the mails for real

SMTP settings are prefilled from the environment variables below. The password is never sent to the browser.

## Command line

- Add environment variables MAIL_HOST, MAIL_USER, MAIL_PASSWORD (.env file supported)
- Add a santas.csv file (name;email;blacklist) at root. (Blacklist is the list of names or emails separated with `,` and is optional)
- Run `yarn start`

Example `santas.csv`:

```csv
# name;email;blacklist
Alice;alice@example.com;Bob
Bob;bob@example.com;Alice
Carol;carol@example.com
Dave;dave@example.com
```

Lines starting with `#` are ignored. Matching of names and emails in the blacklist is case-insensitive.

If the exclusions make a draw impossible, the app stops with an error instead of looping forever.

## Environment variables

| Name          |              Default value               |                         Description |
| :------------ | :--------------------------------------: | ----------------------------------: |
| MAIL_HOST     |                    /                     |                    Mail server host |
| MAIL_PORT     |                   465                    |                    Mail server port |
| MAIL_SECURE   |   `true` if port is 465, else `false`    |              Use TLS from the start |
| MAIL_USER     |                    /                     |                Mail server username |
| MAIL_PASSWORD |                    /                     |                Mail server password |
| MAIL_FROM     |   MAIL_USER or `secret-santa@usson.me`   |                      Sender address |
| MAIL_SUBJECT  |            🎅 Secret Santa 🎅            |                        Mail subject |
| MAIL_CONTENT  | You are the secret santa of {{people}} ! |                        Mail content |
| SANTAS_FILE   |                santas.csv                |                Path to the CSV file |
| SAVE_MAILS    |                  false                   |     save mails in `mails` directory |
| DEBUG         |                  false                   | Print mails instead of sending them |
| GUI_PORT      |                   3000                   |           Port of the web interface |

Templates use [Mustache](https://mustache.github.io/): `{{people}}` is the person to gift and `{{santa}}` is the person receiving the mail. Both work in the subject and in the content.

## Debug

- Add environment variables DEBUG=true (.env file supported)
- Add a santas.csv file (name;email) at root.
- Run `yarn start`

## Tests

```sh
yarn test
```
