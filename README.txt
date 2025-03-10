--- Tutorial ---

1st. Donwloaded Kafka for Windows 10 from https://kafka.apache.org/downloads by following the steps from this useful video(I am a visual lerner) https://www.youtube.com/watch?v=BwYFuhVhshI&ab_channel=AmpCodehM 
2nd. Downloaded FFmpeg for Windows 10 from https://github.com/btbn/ffmpeg-builds/releases by following this video https://www.youtube.com/watch?v=SG1Fc5QB8RE&ab_channel=TechwithM
3rd. Downloaded yt-dlp by running(as I have Python) --> pip install yt-dlp 
4th. Started the " zookeeper-server ". Opened new CMD terminal, accessed the path C:\Kafka and run --> .\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties
5th. Started the " kafka-server ". Opened new CMD terminal, accessed the path C:\Kafka again and run --> .\bin\windows\kafka-server-start.bat .\config\server.properties
6th. Created a topic call " video-events ". Opened new CMD terminal, accessed the path C:\Kafka\bin\windows and run -->  kafka-topics.bat --create --bootstrap-server localhost:9092 --topic video-events
7th. Started the " Kafka Console Consumer " in CMD new terminal by running --> node videoPipeline.js consumer
8th. Started the " Kafka Console Producer" in CMD new terminal by running --> node videoPipeline.js producer

---- Process ---

3 videos will be downloaded from YouTube to temporary folder, the following path--> C:\Ingineria_Produselor_Program\Lab.3_TI-221_PopescuA-Building_a_Video_Pipeline_with_Kafka_and_S3\temp

1st https://www.youtube.com/watch?v=-RXA143mC_0&t=7s&ab_channel=GOAT
2nd https://www.youtube.com/watch?v=VIPH9lY7nUw&t=2s&ab_channel=LosAngelesLakers
3rd https://www.youtube.com/watch?v=fai_cwpo4dA

Next the videos will moved to storage\video folder from the path -->  C:\Ingineria_Produselor_Program\Lab.3_TI-221_PopescuA-Building_a_Video_Pipeline_with_Kafka_and_S3\storage\videos
Then copied, encoded(3 formats - "avi", "webm", "mp4"/mkv didn't work for some reason)and moved the videos to the following path --> C:\Ingineria_Produselor_Program\Lab.3_TI-221_PopescuA-Building_a_Video_Pipeline_with_Kafka_and_S3\temp_encoded


--- NOTE ---

I left the videos in the folders as proof of what I wrote above but it seems I cannot push with git the videos as I reached the max file size, so I had to delete them. Same with New Node.js Project(package.json) and Installed Required Node Packages. 
If you need the New Node.js Project and Install Required Node Packages the run the below commands in Visual Studio terminal:

For New Node.js Project run the following commands in Visual Studio terminal --> npm init -y
For Install Required Node Packages run the following commands in Visual Studio terminal --> npm install kafkajs fluent-ffmpeg @types/node


If you want to validate the process then you can try to follow the --- Tutorial ---
Also, I left a screenshot as proof that I had the videos in my Visual Studio
