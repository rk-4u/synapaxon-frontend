import ContentApproval from '../components/ContentApproval';

const Content = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Approval</h2>
      <p className="text-sm text-gray-500 mb-6">Review and approve user-submitted questions</p>
      <ContentApproval />
    </div>
  );
};

export default Content;