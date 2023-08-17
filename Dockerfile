FROM golang:1.21-alpine

WORKDIR /server

COPY ./*.go /server

RUN go build main.go

EXPOSE 8080

CMD ["./main"]