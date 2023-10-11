import digest from "./digest";

const digester = (name = 'sha-256') => {
  if (name !== 'sha-256'){
    throw new Error('Only sha-256 digest is supported.')
  }
  return {
    name,
    digest
  }
}

export default digester;




