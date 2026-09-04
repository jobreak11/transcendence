# 1-3 บังคับให้อ่านเพื่อเข้าใจกฎเกณฑ์ของ transcendence

# ส่วน 3 ข้อย่อยเลือกเอาว่าจะอ่านหัวข้ออะไร ตามที่ตัวเองสนใจ

# ส่วนแนวทางโปรเจค จะอยู่ในข้อ 4 ย่อยๆลงไป

# README อยู่ข้อ 5

# Instruction 

How to run this project

There are some prerequisites that you may need to have first

1. `make` - this project use makefile to wrap the whole project
2. `docker` - your machine should have docker installed and if installed with
- to install docker, you can follow the instruction [here](https://docs.docker.com/engine/install/). and then add the user to docker group using `sudo usermod -aG docker <user>`
root permission then the user should also in docker group so can use the docker commands without using `sudo`

</br>
</br>

First, this project you need to have `.env` file for the `docker-compose.yml` in the `src/` directory. We've provided the `.env.example` for you to take it from there.

To test, simple copy the `.env.example` and name it as `.env` and put it in the same directory as the `docker-compose.yml` file.

</br>
</br>

Now that everthinng is ready, simply use the `make` command in to root of the repository.
```bash
make
```
it might takes a while, depending on your internet connection.

Once you see this, the deploy process is done.
```bash
[+] up 5/5
 ✔ Image src-nginx                   Built                 2.1s
 ✔ Image src-nextjs                  Built                 2.1s
 ✔ Network src_transcendence-network Created               0.0s
 ✔ Container src-nextjs-1            Healthy              35.9s
 ✔ Container src-nginx-1             Started              36.0s
touch temp/.makefile_stamp_docker_compose_up
```

</br>

you can check on the browser that it is actually 
working by entering `https://localhost:<port>` 
or `https://<your-domain-name>:<port>` (However, your domain need to be configured in `/etc/hosts` because this is self-certificate, and i won't detail it here yet)

</br>

```bash
make fclean
```

to stop the service and tear the containers down. Use this command before commiting to git.

### How to work on this project (current version)

This project now have only frontend and i myself only know how to install it and don't fully how the things work in this node js environment yet, however i will try to explain how to work on fron end with this stack.

</br>

This project use <b>NextJs</b> as frontend framework. It is a nodejs webserver. I installed tailwindcss, framer motion, and babylon.js for you guys to use. 

NextJS works with `app/` directory with `layout.tsx` , `page.tsx` and `public/` directory which stores the static files.

NextJS use <b>React</b>, <b>TypeScript</b>. So having general knowledges on these is required to understand NextJS.

