FROM golang:1.21-alpine

WORKDIR /game

COPY server ./server/ 
COPY go.mod .
COPY client ./client/

RUN go build server/main.go

EXPOSE 8080

CMD ["./main"]