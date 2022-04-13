export default function A({ a }) {
  blockCpuFor(1);
  return (
    <div>
      a<span>{a}</span>
    </div>
  );
}

function blockCpuFor(ms) {
  var now = new Date().getTime();
  var result = 0;
  while (true) {
    result += Math.random() * Math.random();
    if (new Date().getTime() > now + ms) return;
  }
}

export async function getServerSideProps(context) {
  return {
    props: {
      a: 1,
    }, // will be passed to the page component as props
  };
}
