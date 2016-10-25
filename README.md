# node-swiftv1
openstack swift tempauth v1 restful client

## constructor(user: string, password: string, host: string, port: number);
## listContainers(prefix);
## retrieveAccountMetadata();
## listObjects(container, prefix);
## createContainer(container);
## deleteContainer(container) ;
## retrieveContainerMetadata(container);
## getObject(container, object, pipeRes);
## retrieveObjectMetadata(container, object);
## createObject(container, object, pipeReq);
## deleteObject(container, object);
## copyObject(container, object, fromContainer, sourceObject);