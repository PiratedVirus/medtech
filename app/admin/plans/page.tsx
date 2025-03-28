import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/admin/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingPlan) {
        await axios.put(`/api/admin/plans/${editingPlan.id}`, data);
      } else {
        await axios.post('/api/admin/plans', data);
      }
      fetchPlans();
      reset();
      setEditingPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    reset(plan);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/plans/${id}`);
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  return (
    <div>
      <h1>Plans</h1>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...register('name', { required: 'Name is required' })} />
          </FormControl>
          {errors.name && <FormMessage>{errors.name.message}</FormMessage>}
        </FormItem>
        <FormItem>
          <FormLabel>Duration</FormLabel>
          <FormControl>
            <Input {...register('duration', { required: 'Duration is required' })} />
          </FormControl>
          {errors.duration && <FormMessage>{errors.duration.message}</FormMessage>}
        </FormItem>
        <FormItem>
          <FormLabel>Price</FormLabel>
          <FormControl>
            <Input type="number" {...register('price', { required: 'Price is required' })} />
          </FormControl>
          {errors.price && <FormMessage>{errors.price.message}</FormMessage>}
        </FormItem>
        <Button type="submit">{editingPlan ? 'Update' : 'Create'}</Button>
      </Form>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>{plan.name}</TableCell>
              <TableCell>{plan.duration}</TableCell>
              <TableCell>{plan.price}</TableCell>
              <TableCell>
                <Button onClick={() => handleEdit(plan)}>Edit</Button>
                <Button onClick={() => handleDelete(plan.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlansPage;
