import MietimmobilieDetail from './MietimmobilieDetail';
import MehrfamilienhausDetail from './MehrfamilienhausDetail';
import KaufimmobilieDetail from './KaufimmobilieDetail';

// Reiner Router — keine Hooks hier, damit Rules of Hooks nicht verletzt werden
const ImmobilienDetail = (props) => {
  const { immobilie } = props;
  if (immobilie.immobilienTyp === 'mietimmobilie') return <MietimmobilieDetail {...props} />;
  if (immobilie.immobilienTyp === 'mehrfamilienhaus') return <MehrfamilienhausDetail {...props} />;
  return <KaufimmobilieDetail {...props} />;
};

export default ImmobilienDetail;
