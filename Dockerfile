FROM golang:1.21-alpine

WORKDIR /game

COPY server ./server/ 
COPY go.mod .
COPY go.sum .
COPY client ./client/

RUN go build server/*.go

EXPOSE 8080

CMD ["./main", "-prod"]