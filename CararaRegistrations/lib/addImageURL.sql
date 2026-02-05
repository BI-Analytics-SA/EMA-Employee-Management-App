INSERT INTO TMEW_CA_EmpImages (Emp_FK,EmpURL,FileName)
VALUES (
	{{ emplFK }} ,
	{{ URL }} ,
    {{ s3fileName }}
);