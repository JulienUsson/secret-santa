# Secret Santa

This app choose secret santa for each people and send them mail to keep it secret.

## Environment variable

| Name          |              Default value               |                         Description |
| :------------ | :--------------------------------------: | ----------------------------------: |
| MAIL_HOST     |                    /                     |                    Mail server host |
| MAIL_PORT     |                   465                    |                    Mail server port |
| MAIL_USER     |                    /                     |                Mail server username |
| MAIL_PASSWORD |                    /                     |                Mail server password |
| TEMPLATE      | You are the secret santa of {{people}} ! |                        Mail content |
| DEBUG         |                  false                   | Print mails instead of sending them |

## Run

- Add environment variables MAIL_HOST, MAIL_USER, MAIL_PASS (.env file supported)
- Add a santas.csv file (name;email;[blacklist]) at root.
- Run `yarn start`

## Debug

- Add environment variables DEBUG=true (.env file supported)
- Add a santas.csv file (name;email) at root.
- Run `yarn start`
