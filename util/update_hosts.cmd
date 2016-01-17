ECHO OFF
SET NEWLINE=^& echo.

SET DOMAIN=eventnet.com

ECHO ON
SET /p IP="Enter IP for eventnet.com: "

ECHO OFF

ECHO %NEWLINE%^%IP% %DOMAIN%>>%WINDIR%\System32\drivers\etc\hosts

ECHO "IP for eventnet.com updated"
