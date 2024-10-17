import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Select,
  Link,
  useToast,
  Input,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Offer {
  id: number;
  ride_id: number;
  driver: {
    id: number;
    name: string;
    rating: number;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    color: string;
  };
  price: number;
  selected: boolean;
}

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: number;
}

const OffersModal: React.FC<OffersModalProps> = ({
  isOpen,
  onClose,
  rideId,
}) => {
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");
  const [pin, setPin] = useState<string>("");
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    data: offers,
    isLoading,
    isError,
  } = useQuery<Offer[]>({
    queryKey: ["offers", rideId],
    queryFn: async () => {
      const response = await axios.get(
        `http://localhost:3001/api/v1/offer/?ride_id=${rideId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      return response.data;
    },
    refetchInterval: 5000,
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async ({ rideId, offerId }: { rideId: number; offerId: number }) => {
      const response = await axios.put(
        `http://localhost:3001/api/v1/offer/select-offer`,
        { ride_id: rideId, offer_id: offerId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["offers", rideId]);
      queryClient.invalidateQueries(["userRides"]);
      toast({
        title: "Offer accepted",
        description: `Your PIN is ${data.pin}. Please remember it for your ride.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error accepting offer",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const cancelRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      await axios.delete(`http://localhost:3001/api/v1/ride/${rideId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["userRides"]);
      toast({
        title: "Ride cancelled successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error cancelling ride",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const sortedOffers = offers?.sort((a, b) =>
    sortBy === "price" ? a.price - b.price : b.driver.rating - a.driver.rating
  );

  const handleAccept = (offerId: number) => {
    acceptOfferMutation.mutate({ rideId, offerId });
  };

  const handleDecline = (offerId: number) => {
    // For simplicity, we'll just remove the offer from the list
    // In a real app, you might want to send this information to the backend
    queryClient.setQueryData<Offer[]>(["offers", rideId], (oldData) => 
      oldData ? oldData.filter(offer => offer.id !== offerId) : []
    );
  };

  const handleCancelRide = () => {
    cancelRideMutation.mutate(rideId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Offers for Ride #{rideId}</ModalHeader>
        <ModalBody>
          <Select
            mb={4}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "price" | "rating")}
          >
            <option value="price">Sort by Price</option>
            <option value="rating">Sort by Rating</option>
          </Select>
          {isLoading ? (
            <Text>Loading offers...</Text>
          ) : isError ? (
            <Text>Error loading offers</Text>
          ) : sortedOffers && sortedOffers.length > 0 ? (
            <VStack spacing={4} align="stretch">
              {sortedOffers.map((offer) => (
                <Box key={offer.id} p={4} borderWidth={1} borderRadius="md">
                  <Text>Driver: {offer.driver.name}</Text>
                  <Text>Price: ${offer.price.toFixed(2)}</Text>
                  <Text>
                    Rating: {offer.driver.rating} (
                    <Link href="#">Go to Reviews</Link>)
                  </Text>
                  <Text>
                    Vehicle: {offer.vehicle.brand} {offer.vehicle.model}
                  </Text>
                  <HStack mt={2} spacing={2}>
                    <Button
                      colorScheme="green"
                      onClick={() => handleAccept(offer.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      colorScheme="red"
                      onClick={() => handleDecline(offer.id)}
                    >
                      Decline
                    </Button>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text>No offers available yet.</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="red" mr={3} onClick={handleCancelRide}>
            Cancel Ride
          </Button>
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OffersModal;